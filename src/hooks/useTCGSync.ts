
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

export interface JobStatus {
  id: string;
  job_id: string;
  source: string;
  status: 'pending' | 'fetching_data' | 'processing_data' | 'saving_to_database' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  completed_items: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error: string | null;
}

interface UseTCGSyncOptions {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  label: string;
  onSuccess?: () => void;
}

export const useTCGSync = ({ source, label, onSuccess }: UseTCGSyncOptions) => {
  const [loading, setLoading] = useState(false);
  const [edgeFunctionResponse, setEdgeFunctionResponse] = useState<any>(null);
  const [cooldown, setCooldown] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [partitionInfo, setPartitionInfo] = useState<any>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const { toast } = useToast();

  // Rate limiting configuration
  const COOLDOWN_TIME = 60; // 1 minute cooldown between syncs (in seconds)
  const RATE_LIMIT_KEY = `sync_${source}`;
  const TCG_PARTITION = "tcg";
  const JOB_POLL_INTERVAL = 2000; // Poll every 2 seconds
  
  // Check rate limit status and partition info on component mount and periodically
  useEffect(() => {
    // Initial check
    updateStatus();
    
    // Setup interval to update status
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [source]);
  
  // Set up job status polling
  useEffect(() => {
    if (!currentJobId) return;
    
    const pollJobStatus = async () => {
      try {
        const result = await supabase.functions.invoke('fetch-tcg-sets', {
          body: { jobId: currentJobId },
        });
        
        if (result.error) {
          console.error("Error polling job status:", result.error);
          return;
        }
        
        if (result.data && result.data.success && result.data.job) {
          setJobStatus(result.data.job as JobStatus);
          
          // If job is completed or failed, clean up
          if (result.data.job.status === 'completed' || result.data.job.status === 'failed') {
            setCurrentJobId(null);
            setLoading(false);
            
            if (result.data.job.status === 'completed') {
              // Show success message
              toast({
                title: "Success",
                description: `Successfully synchronized ${label} data`,
              });
              
              // Update cached last sync time
              const now = new Date().toISOString();
              setCache(`last_sync_time_${source}`, now, 5, TCG_PARTITION);
              
              // Invalidate cache after successful sync
              invalidateTcgCache(source);
              
              if (onSuccess) {
                onSuccess();
              }
            } else {
              // Show error message
              toast({
                title: "Error",
                description: result.data.job.error || `Failed to synchronize ${label} data`,
                variant: "destructive",
              });
            }
          }
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    };
    
    // Start polling
    pollJobStatus();
    const interval = setInterval(pollJobStatus, JOB_POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [currentJobId, source, label, onSuccess, toast]);
  
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
    if (loading || currentJobId) return;
    
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
        
        setLoading(false);
        throw new Error(`Rate limited. Please try again in ${formatTimeRemaining(retryAfter)}`);
      }
      
      // Destructure the response
      const { data, error } = result;

      if (error) {
        console.error(`Edge function error:`, error);
        setLoading(false);
        throw new Error(`Edge Function Error: ${error.message || "Unknown error calling Edge Function"}`);
      }

      console.log(`Edge function response:`, data);

      // If job was successfully started, store the job ID and start polling
      if (data && data.success && data.jobId) {
        setCurrentJobId(data.jobId);
        toast({
          title: "Job Started",
          description: `${label} data synchronization has started. Please wait while we process the data.`,
        });
      } else if (data && data.success) {
        // If no job ID but success, assume it completed immediately
        setLoading(false);
        toast({
          title: "Success",
          description: data.message,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setLoading(false);
        throw new Error(data?.error || "Unknown error occurred in the edge function response");
      }
    } catch (err: any) {
      console.error(`Error syncing ${source} data:`, err);
      setLoading(false);
      
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
      // Update partition info after sync attempt
      updateStatus();
    }
  };

  return {
    loading,
    cooldown,
    timeRemaining,
    partitionInfo,
    edgeFunctionResponse,
    jobStatus,
    currentJobId,
    syncData,
  };
};
