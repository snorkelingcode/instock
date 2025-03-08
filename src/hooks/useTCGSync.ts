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

  const COOLDOWN_TIME = 60; // 1 minute cooldown between syncs (in seconds)
  const RATE_LIMIT_KEY = `sync_${source}`;
  const TCG_PARTITION = "tcg";
  const JOB_POLL_INTERVAL = 2000; // Poll every 2 seconds
  
  useEffect(() => {
    updateStatus();
    
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [source]);
  
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
          
          if (result.data.job.status === 'completed' || result.data.job.status === 'failed') {
            setCurrentJobId(null);
            setLoading(false);
            
            if (result.data.job.status === 'completed') {
              toast({
                title: "Success",
                description: `Successfully synchronized ${label} data`,
              });
              
              const now = new Date().toISOString();
              setCache(`last_sync_time_${source}`, now, 5, TCG_PARTITION);
              
              invalidateTcgCache(source);
              
              if (onSuccess) {
                onSuccess();
              }
            } else {
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
    
    pollJobStatus();
    const interval = setInterval(pollJobStatus, JOB_POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [currentJobId, source, label, onSuccess, toast]);
  
  const updateStatus = () => {
    const remaining = getRateLimitTimeRemaining(RATE_LIMIT_KEY);
    setTimeRemaining(remaining);
    setCooldown(remaining > 0);
    
    const info = getPartitionInfo(TCG_PARTITION);
    setPartitionInfo(info);
  };
  
  const checkLastSyncTime = async () => {
    try {
      const cachedTimeKey = `last_sync_time_${source}`;
      const cachedTime = getCache<string>(cachedTimeKey, TCG_PARTITION);
      
      if (cachedTime) {
        const lastSync = new Date(cachedTime);
        const now = new Date();
        const timeDiff = now.getTime() - lastSync.getTime();
        
        return timeDiff > (COOLDOWN_TIME * 1000);
      }
      
      const { data, error } = await supabase
        .from('api_config')
        .select('last_sync_time')
        .eq('api_name', source)
        .single();
        
      if (error) {
        console.error("Error checking last sync time:", error);
        return true;
      }
      
      if (!data || !data.last_sync_time) {
        return true;
      }
      
      setCache(cachedTimeKey, data.last_sync_time, 5, TCG_PARTITION);
      
      const lastSync = new Date(data.last_sync_time);
      const now = new Date();
      const timeDiff = now.getTime() - lastSync.getTime();
      
      return timeDiff > (COOLDOWN_TIME * 1000);
    } catch (err) {
      console.error("Error in rate limit check:", err);
      return true;
    }
  };

  const syncData = async () => {
    if (loading || currentJobId) return;
    
    if (isRateLimited(RATE_LIMIT_KEY)) {
      toast({
        title: "Rate Limited",
        description: `Please wait ${formatTimeRemaining(timeRemaining)} before syncing ${label} data again`,
        variant: "destructive",
      });
      return;
    }
    
    const isAuthenticated = localStorage.getItem("syncPageAuthenticated") === "true";
    
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "You need to be authenticated to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    const canSync = await checkLastSyncTime();
    
    if (!canSync) {
      toast({
        title: "Rate Limited",
        description: `Please wait before syncing ${label} data again`,
        variant: "destructive",
      });
      setRateLimit(RATE_LIMIT_KEY, COOLDOWN_TIME);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Starting ${source} data sync...`);
      
      setRateLimit(RATE_LIMIT_KEY, COOLDOWN_TIME);
      setCooldown(true);
      
      console.log(`Attempting to invoke edge function 'fetch-tcg-sets' with source: ${source}`);
      const result = await supabase.functions.invoke('fetch-tcg-sets', {
        body: { 
          source,
          accessKey: "TCG-SYNC-ACCESS-2024"
        },
      });
      
      if (result.error && result.error.message && result.error.message.includes("429")) {
        console.log("Server returned rate limit response");
        
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
        
        syncServerRateLimit(RATE_LIMIT_KEY, retryAfter);
        
        setLoading(false);
        throw new Error(`Rate limited. Please try again in ${formatTimeRemaining(retryAfter)}`);
      }
      
      const { data, error } = result;

      if (error) {
        console.error(`Edge function error:`, error);
        setLoading(false);
        throw new Error(`Edge Function Error: ${error.message || "Unknown error calling Edge Function"}`);
      }

      console.log(`Edge function response:`, data);

      if (data && data.success && data.jobId) {
        setCurrentJobId(data.jobId);
        toast({
          title: "Job Started",
          description: `${label} data synchronization has started. Please wait while we process the data.`,
        });
      } else if (data && data.success) {
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
      
      let errorMessage = `Failed to sync ${label} data`;
      
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
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
