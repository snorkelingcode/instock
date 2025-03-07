
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";

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
  const { toast } = useToast();

  // Rate limiting implementation
  const COOLDOWN_TIME = 60000; // 1 minute cooldown between syncs
  
  const checkLastSyncTime = async () => {
    try {
      // Get last sync time for this API
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
      
      const lastSync = new Date(data.last_sync_time);
      const now = new Date();
      const timeDiff = now.getTime() - lastSync.getTime();
      
      return timeDiff > COOLDOWN_TIME;
    } catch (err) {
      console.error("Error in rate limit check:", err);
      return true; // Allow sync if check fails
    }
  };

  const syncData = async () => {
    if (loading) return;
    
    // Check if user has admin permissions
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    
    if (adminError || !isAdmin) {
      toast({
        title: "Error",
        description: "You don't have admin privileges to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    // Implement rate limiting check
    const canSync = await checkLastSyncTime();
    
    if (!canSync) {
      toast({
        title: "Rate Limited",
        description: `Please wait before syncing ${label} data again`,
        variant: "destructive",
      });
      setCooldown(true);
      setTimeout(() => setCooldown(false), COOLDOWN_TIME);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Starting ${source} data sync...`);
      
      // Call the Supabase Edge Function
      console.log(`Attempting to invoke edge function 'fetch-tcg-sets' with source: ${source}`);
      const result = await supabase.functions.invoke('fetch-tcg-sets', {
        body: { source },
      });
      
      // Store the complete response for debugging
      setEdgeFunctionResponse(result);
      
      // Destructure the response
      const { data, error } = result;

      if (error) {
        console.error(`Edge function error:`, error);
        throw new Error(`Edge Function Error: ${error.message || "Unknown error calling Edge Function"}`);
      }

      console.log(`Edge function response:`, data);

      if (data && data.success) {
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
        {loading ? `Syncing ${label}...` : cooldown ? "Cooldown..." : `Sync ${label} Data`}
      </Button>
      
      <div className="text-xs text-gray-500 mt-1">
        <p>Images will be downloaded and stored locally in Supabase.</p>
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
