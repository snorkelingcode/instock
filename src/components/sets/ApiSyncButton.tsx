
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { 
  invalidateTcgCache, 
  isRateLimited, 
  setRateLimit, 
  getRateLimitTimeRemaining,
  syncServerRateLimit,
  formatTimeRemaining,
  getPartitionInfo,
  setCache,
  getCache
} from "@/utils/cacheUtils";

interface ApiSyncButtonProps {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  label: string;
  onSuccess?: () => void;
}

const ApiSyncButton: React.FC<ApiSyncButtonProps> = ({ 
  source, 
  label,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [edgeFunctionResponse, setEdgeFunctionResponse] = useState<any>(null);
  const [cooldown, setCooldown] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [partitionInfo, setPartitionInfo] = useState<any>(null);
  const { toast } = useToast();

  // Rate limiting configuration
  const COOLDOWN_TIME = 60; // 1 minute cooldown between syncs (in seconds)
  const RATE_LIMIT_KEY = `sync_${source}`;
  const TCG_PARTITION = "tcg";
  
  // Check rate limit status and partition info on component mount and periodically
  useEffect(() => {
    // Initial check
    updateStatus();
    
    // Setup interval to update status
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [source]);
  
  const updateStatus = () => {
    // Update rate limit status
    const remaining = getRateLimitTimeRemaining(RATE_LIMIT_KEY);
    setTimeRemaining(remaining);
    setCooldown(remaining > 0);
    
    // Update partition info
    const info = getPartitionInfo(TCG_PARTITION);
    setPartitionInfo(info);
  };
  
  const checkLastSyncTime = async () => {
    try {
      // Try to get last sync time from cache first
      const cachedTimeKey = `last_sync_time_${source}`;
      const cachedTime = getCache<string>(cachedTimeKey, TCG_PARTITION);
      
      if (cachedTime) {
        const lastSync = new Date(cachedTime);
        const now = new Date();
        const timeDiff = now.getTime() - lastSync.getTime();
        
        // Convert COOLDOWN_TIME from seconds to milliseconds for comparison
        return timeDiff > (COOLDOWN_TIME * 1000);
      }
      
      // If not in cache, query the database
      const { data, error } = await supabase
        .from('api_config')
        .select('last_sync_time')
        .eq('api_name', source)
        .single();
        
      if (error) {
        console.error("Error checking last sync time:", error);
        return true; // Allow sync if we can't check
      }
      
      if (!data || !data.last_sync_time) {
        return true; // No previous sync, allow it
      }
      
      // Cache the last sync time for future reference
      setCache(cachedTimeKey, data.last_sync_time, 5, TCG_PARTITION); // Cache for 5 minutes
      
      const lastSync = new Date(data.last_sync_time);
      const now = new Date();
      const timeDiff = now.getTime() - lastSync.getTime();
      
      // Convert COOLDOWN_TIME from seconds to milliseconds for comparison
      return timeDiff > (COOLDOWN_TIME * 1000);
    } catch (err) {
      console.error("Error in rate limit check:", err);
      return true; // Allow sync if check fails
    }
  };

  const syncData = async () => {
    if (loading) return;
    
    // Check if operation is rate limited
    if (isRateLimited(RATE_LIMIT_KEY)) {
      toast({
        title: "Rate Limited",
        description: `Please wait ${formatTimeRemaining(timeRemaining)} before syncing ${label} data again`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has admin permissions
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You need to be logged in to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    // Check admin role using has_role function
    const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', {
      _user_id: session.user.id,
      _role: 'admin'
    });
    
    if (adminError || !isAdmin) {
      toast({
        title: "Error",
        description: "You don't have admin privileges to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    // Implement rate limiting check using database last sync time
    const canSync = await checkLastSyncTime();
    
    if (!canSync) {
      toast({
        title: "Rate Limited",
        description: `Please wait before syncing ${label} data again`,
        variant: "destructive",
      });
      // Set the client-side rate limit
      setRateLimit(RATE_LIMIT_KEY, COOLDOWN_TIME);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Starting ${source} data sync...`);
      
      // Apply client-side rate limit before making the request
      setRateLimit(RATE_LIMIT_KEY, COOLDOWN_TIME);
      setCooldown(true);
      
      // Call the Supabase Edge Function
      console.log(`Attempting to invoke edge function 'fetch-tcg-sets' with source: ${source}`);
      const result = await supabase.functions.invoke('fetch-tcg-sets', {
        body: { source },
      });
      
      // Store the complete response for debugging
      setEdgeFunctionResponse(result);
      
      // Check for rate limiting response (HTTP 429)
      if (result.error && result.error.message && result.error.message.includes("429")) {
        console.log("Server returned rate limit response");
        
        // Extract retry after time from response if available
        let retryAfter = COOLDOWN_TIME;
        try {
          if (result.error.context && result.error.context.responseText) {
            const responseData = JSON.parse(result.error.context.responseText);
            if (responseData.retryAfter) {
              retryAfter = parseInt(responseData.retryAfter, 10);
            }
          }
        } catch (e) {
          console.error("Error parsing retry-after value:", e);
        }
        
        // Sync the server-side rate limit with client-side
        syncServerRateLimit(RATE_LIMIT_KEY, retryAfter);
        
        throw new Error(`Rate limited. Please try again in ${formatTimeRemaining(retryAfter)}`);
      }
      
      // Destructure the response
      const { data, error } = result;

      if (error) {
        console.error(`Edge function error:`, error);
        throw new Error(`Edge Function Error: ${error.message || "Unknown error calling Edge Function"}`);
      }

      console.log(`Edge function response:`, data);

      if (data && data.success) {
        // Update the cached last sync time
        const now = new Date().toISOString();
        setCache(`last_sync_time_${source}`, now, 5, TCG_PARTITION);
        
        // Invalidate cache after successful sync
        invalidateTcgCache(source);
        
        toast({
          title: "Success",
          description: data.message,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data?.error || "Unknown error occurred in the edge function response");
      }
    } catch (err: any) {
      console.error(`Error syncing ${source} data:`, err);
      
      // More detailed error message
      let errorMessage = `Failed to sync ${label} data`;
      
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      // Check if it's a network error or function not found
      if (err.message?.includes("Failed to fetch") || 
          err.message?.includes("NetworkError") ||
          err.message?.includes("network error") ||
          err.message?.includes("Failed to send")) {
        errorMessage = `Edge function 'fetch-tcg-sets' could not be reached. Please verify the function is deployed and running.`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Update partition info after sync
      updateStatus();
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={syncData} 
        disabled={loading || cooldown}
        className="flex items-center gap-2"
      >
        {loading ? (
          <LoadingSpinner size="sm" color={source === "pokemon" ? "red" : source === "mtg" ? "blue" : source === "yugioh" ? "purple" : "green"} />
        ) : (
          <RefreshCw className={`h-4 w-4 ${cooldown ? 'animate-pulse text-gray-400' : ''}`} />
        )}
        {loading ? `Syncing ${label}...` : 
         cooldown ? `Cooldown (${formatTimeRemaining(timeRemaining)})` : 
         `Sync ${label} Data`}
      </Button>
      
      <div className="text-xs text-gray-500 mt-1">
        <p>Images will be downloaded and stored locally in Supabase.</p>
        {partitionInfo && (
          <p className="mt-1">
            TCG Partition: {(partitionInfo.size / 1024).toFixed(2)}KB cached, 
            Last updated: {new Date(partitionInfo.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
      
      {edgeFunctionResponse && (
        <div className="text-xs text-gray-500 mt-1">
          <details>
            <summary>Debug Info</summary>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32 text-xs">
              {JSON.stringify(edgeFunctionResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ApiSyncButton;
