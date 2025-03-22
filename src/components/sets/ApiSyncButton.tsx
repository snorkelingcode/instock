
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface JobStatus {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
  user_id: string | null;
  result_summary: any;
  payload?: any;
}

interface ApiSyncButtonProps {
  game: string;
  source?: string;
  label?: string;
  onSuccess?: () => void;
}

const ApiSyncButton: React.FC<ApiSyncButtonProps> = ({ game, source, label, onSuccess }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<JobStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [syncType, setSyncType] = useState('full');
  const [setCode, setSetCode] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { user } = useAuth();

  const targetSource = source || game;

  // Improved query with error handling and automatic retry with backoff
  const { data: jobStatusData, refetch: refetchJobStatus } = useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      
      // Implement rate limiting to prevent excessive requests
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      
      // Wait at least 2 seconds between requests
      if (timeSinceLastFetch < 2000 && lastFetchTime > 0) {
        return currentStatus; // Return current status without fetching
      }
      
      setLastFetchTime(now);
      
      try {
        const { data, error } = await supabase.rpc('get_job_by_id', { job_id: jobId });

        if (error) {
          console.error("Error fetching job status:", error);
          throw error;
        }
        
        // Reset retry count on successful fetch
        setRetryCount(0);
        return data.length > 0 ? data[0] as JobStatus : null;
      } catch (error) {
        console.error("Error fetching job status:", error);
        
        // Increment retry count on failure
        setRetryCount(prev => prev + 1);
        
        // If we've tried too many times, stop polling
        if (retryCount > 5) {
          setIsPolling(false);
          toast({
            title: "Connection Issue",
            description: "Unable to get update on sync status. The operation may still be running in the background.",
            variant: "destructive",
          });
        }
        
        // Return current status on error
        return currentStatus;
      }
    },
    enabled: !!jobId && isPolling,
    refetchInterval: isPolling ? getPollingInterval(retryCount) : false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Function to calculate polling interval with exponential backoff
  function getPollingInterval(retries: number): number {
    // Start with 5 seconds, then increase with each retry
    // 5s, 10s, 20s, 30s (max)
    return Math.min(5000 * Math.pow(1.5, retries), 30000);
  }

  useEffect(() => {
    if (jobStatusData) {
      setCurrentStatus(jobStatusData);
      
      if (jobStatusData.status === 'completed' || jobStatusData.status === 'failed') {
        setIsPolling(false);
        
        if (jobStatusData.status === 'completed') {
          toast({
            title: "Sync Completed",
            description: `Successfully synced ${label || game} sets.`,
          });
          if (onSuccess) {
            onSuccess();
          }
        } else if (jobStatusData.status === 'failed') {
          toast({
            title: "Sync Failed",
            description: `Sync failed for ${label || game} sets: ${jobStatusData.error_message || 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }
    }
  }, [jobStatusData, game, label, onSuccess, toast]);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_sync_job', {
        job_details: {
          job_type: `sync_${targetSource.toLowerCase()}_sets`,
          user_id: user?.id || null,
          sync_type: syncType,
          set_code: setCode
        }
      });

      if (error) {
        console.error("Error starting sync:", error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      setJobId(data);
      setCurrentStatus({
        id: data,
        job_type: `sync_${targetSource.toLowerCase()}_sets`,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        user_id: user?.id || null,
        result_summary: null,
      });
      setIsSyncing(false);
      setOpen(false);
      setIsPolling(true);
      setRetryCount(0);
      setLastFetchTime(Date.now());

      toast({
        title: "Sync Started",
        description: `Syncing ${label || game} sets...`,
      });
      
      setTimeout(() => {
        refetchJobStatus();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start sync",
        variant: "destructive",
      });
      setIsSyncing(false);
    },
  });

  const handleSync = async () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  const getStatusColor = () => {
    if (!currentStatus) return 'text-gray-500';
    
    switch (currentStatus.status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (!currentStatus) return null;
    
    switch (currentStatus.status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin mr-2" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin mr-2" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500 mr-2" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setOpen(true)}>
                Sync Sets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync {label || game} Sets</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the type of sync you want to perform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="syncType" className="text-right">
                Sync Type
              </Label>
              <Select onValueChange={setSyncType} defaultValue={syncType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select sync type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Sync</SelectItem>
                  <SelectItem value="single">Single Set Sync</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {syncType === 'single' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="setCode" className="text-right">
                  Set Code
                </Label>
                <Input
                  id="setCode"
                  value={setCode}
                  onChange={(e) => setSetCode(e.target.value)}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isSyncing} onClick={handleSync}>
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {currentStatus && (
        <div className="mt-4">
          <p className={`font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            Status: {currentStatus.status}
          </p>
          {currentStatus.status === 'running' && (
            <Progress value={50} />
          )}
          {currentStatus.error_message && (
            <p className="text-red-500">Error: {currentStatus.error_message}</p>
          )}
          {currentStatus.result_summary && (
            <p className="text-gray-500">
              {Object.keys(currentStatus.result_summary).map((key) => (
                <div key={key}>
                  {key}: {currentStatus.result_summary[key]}
                </div>
              ))}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default ApiSyncButton;
