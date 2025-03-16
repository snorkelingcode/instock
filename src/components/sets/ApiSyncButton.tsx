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
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext";

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
}

interface ApiSyncButtonProps {
  game: string;
}

const ApiSyncButton: React.FC<ApiSyncButtonProps> = ({ game }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<JobStatus | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [syncType, setSyncType] = useState('full');
  const [setCode, setSetCode] = useState('');
  const { user } = useAuth();

  // Fetch job status
  const { data: jobStatusData, refetch: refetchJobStatus } = useQuery(
    ['jobStatus', jobId],
    async () => {
      if (!jobId) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error("Error fetching job status:", error);
        throw error;
      }
      return data as JobStatus;
    },
    {
      enabled: !!jobId,
      refetchInterval: isPolling ? 5000 : false, // Poll every 5 seconds
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch job status",
          variant: "destructive",
        });
        setIsPolling(false);
        clearInterval(intervalId || undefined);
        setIntervalId(null);
      },
      onSuccess: (data) => {
        if (data) {
          setCurrentStatus(data);
          if (data.status === 'completed' || data.status === 'failed') {
            setIsPolling(false);
            clearInterval(intervalId || undefined);
            setIntervalId(null);
            if (data.status === 'completed') {
              toast({
                title: "Sync Completed",
                description: `Successfully synced ${game} sets.`,
              });
            } else if (data.status === 'failed') {
              toast({
                title: "Sync Failed",
                description: `Sync failed for ${game} sets. Check the logs for more details.`,
                variant: "destructive",
              });
            }
          }
        }
      },
    }
  );

  // Mutation to start the sync
  const syncMutation = useMutation(
    async () => {
      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            job_type: `sync_${game.toLowerCase()}_sets`,
            status: 'pending',
            user_id: user?.id || null,
            payload: {
              sync_type: syncType,
              set_code: setCode,
            }
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error("Error starting sync:", error);
        throw error;
      }
      return data;
    },
    {
      onSuccess: (data: any) => {
        setJobId(data.id);
        setCurrentStatus({
          id: data.id,
          job_type: data.job_type,
          status: data.status,
          created_at: data.created_at,
          updated_at: data.updated_at,
          completed_at: null,
          error_message: null,
          user_id: user?.id || null,
          result_summary: null,
        });
        setIsSyncing(false);
        setOpen(false);
        setIsPolling(true);

        // Start polling
        const id = setInterval(() => {
          refetchJobStatus();
        }, 5000);
        setIntervalId(id);

        toast({
          title: "Sync Started",
          description: `Syncing ${game} sets...`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to start sync",
          variant: "destructive",
        });
        setIsSyncing(false);
        setIsPolling(false);
        clearInterval(intervalId || undefined);
        setIntervalId(null);
      },
    }
  );

  const handleSync = async () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  const handleJobStatus = useCallback(async (jobId: string, setCurrentStatus: React.Dispatch<React.SetStateAction<JobStatus | null>>, defaultErrorValue: any) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error("Error fetching job status:", error);
        setCurrentStatus((prevStatus) => ({
          ...prevStatus,
          status: 'failed',
          error_message: error.message || 'Failed to fetch job status',
        }));
        return;
      }

      setCurrentStatus(data as JobStatus);

      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false);
        clearInterval(intervalId || undefined);
        setIntervalId(null);
      }
    } catch (error: any) {
      console.error("Error fetching job status:", error);
      setCurrentStatus((prevStatus) => ({
        ...prevStatus,
        status: 'failed',
        error_message: error.message || 'Failed to fetch job status',
      }));
      setIsPolling(false);
      clearInterval(intervalId || undefined);
      setIntervalId(null);
    }
  }, [intervalId]);

  useEffect(() => {
    if (jobId && isPolling) {
      const checkStatus = async () => {
        if (jobId) {
          await handleJobStatus(jobId, setCurrentStatus, null);
        }
      };

      checkStatus(); // Initial check

      const id = setInterval(() => {
        checkStatus();
      }, 5000);

      setIntervalId(id);

      return () => {
        clearInterval(id);
        setIntervalId(null);
      };
    }
  }, [jobId, isPolling, handleJobStatus, setCurrentStatus]);

  const getStatusColor = () => {
    switch (currentStatus?.status) {
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
    switch (currentStatus?.status) {
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
            <AlertDialogTitle>Sync {game} Sets</AlertDialogTitle>
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
