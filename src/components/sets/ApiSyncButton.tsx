import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";
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

// Job status interface
interface JobStatus {
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

// API Config interface
interface ApiConfig {
  id: number;
  api_name: string;
  last_sync_time: string | null;
  sync_frequency: string | null;
  created_at: string | null;
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
  }, [currentJobId, source, label, onSuccess]);
  
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
        .eq('api_name', source as string);
        
      if (error) {
        console.error("Error checking last sync time:", error);
        return true;
      }
      
      if (!data || data.length === 0 || !data[0]?.last_sync_time) {
        return true;
      }
      
      setCache(cachedTimeKey, data[0].last_sync_time, 5, TCG_PARTITION);
      
      const lastSync = new Date(data[0].last_sync_time);
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
        description: "You are not authorized to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAuthenticated) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You need to be logged in to perform this action",
          variant: "destructive",
        });
        return;
      }
      
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
        body: { source },
      });
      
      setEdgeFunctionResponse(result);
      
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

  const renderJobStatus = () => {
    if (!jobStatus) return null;
    
    let statusText = "";
    let progressValue = jobStatus.progress || 0;
    
    switch (jobStatus.status) {
      case 'pending':
        statusText = "Preparing job...";
        break;
      case 'fetching_data':
        statusText = "Fetching data from API...";
        break;
      case 'processing_data':
        statusText = `Processing ${jobStatus.completed_items}/${jobStatus.total_items} sets`;
        break;
      case 'saving_to_database':
        statusText = "Saving data to database...";
        progressValue = 95;
        break;
      case 'completed':
        statusText = "Completed successfully";
        progressValue = 100;
        break;
      case 'failed':
        statusText = `Failed: ${jobStatus.error || "Unknown error"}`;
        break;
      default:
        statusText = `Status: ${jobStatus.status}`;
    }
    
    return (
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{statusText}</span>
          <span>{progressValue}%</span>
        </div>
        <Progress value={progressValue} className="h-1" />
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={syncData} 
        disabled={loading || cooldown || !!currentJobId}
        className="flex items-center gap-2"
      >
        {loading || currentJobId ? (
          <LoadingSpinner size="sm" color={source === "pokemon" ? "red" : source === "mtg" ? "blue" : source === "yugioh" ? "purple" : "green"} />
        ) : (
          <RefreshCw className={`h-4 w-4 ${cooldown ? 'animate-pulse text-gray-400' : ''}`} />
        )}
        {currentJobId ? `Syncing ${label}...` : 
         loading ? `Starting ${label} sync...` :
         cooldown ? `Cooldown (${formatTimeRemaining(timeRemaining)})` : 
         `Sync ${label} Data`}
      </Button>
      
      {renderJobStatus()}
      
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
