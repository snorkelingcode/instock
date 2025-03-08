
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DebugInfo from "./DebugInfo";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface CardDownloadManagerProps {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  label: string;
  setId?: string;
}

const CardDownloadManager: React.FC<CardDownloadManagerProps> = ({ 
  source, 
  label,
  setId
}) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const { toast } = useToast();
  
  const ACCESS_KEY = "TCG-SYNC-ACCESS-2024";
  
  useEffect(() => {
    if (!jobId) return;
    
    const pollJobStatus = async () => {
      try {
        const result = await supabase.functions.invoke('download-tcg-cards', {
          body: { jobId },
        });
        
        if (result.error) {
          console.error("Error polling job status:", result.error);
          return;
        }
        
        if (result.data && result.data.success && result.data.job) {
          setJobStatus(result.data.job);
          
          // Calculate progress
          const progress = result.data.job.total_items > 0
            ? Math.round((result.data.job.processed_items / result.data.job.total_items) * 100)
            : 0;
          
          setJobProgress(progress);
          
          if (result.data.job.status === 'completed' || result.data.job.status === 'failed') {
            setJobId(null);
            setLoading(false);
            
            if (result.data.job.status === 'completed') {
              toast({
                title: "Success",
                description: `Successfully downloaded ${label} card data and images`,
              });
            } else {
              toast({
                title: "Error",
                description: result.data.job.error || `Failed to download ${label} card data`,
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
    const interval = setInterval(pollJobStatus, 2000);
    
    return () => clearInterval(interval);
  }, [jobId, source, label, toast]);
  
  const startDownload = async () => {
    if (loading || jobId) return;
    
    const isAuthenticated = localStorage.getItem("syncPageAuthenticated") === "true";
    
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "You need to be authenticated to perform this action",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Starting ${source} card download...`);
      
      const result = await supabase.functions.invoke('download-tcg-cards', {
        body: { 
          source,
          setId,
          downloadImages: true,
          accessKey: ACCESS_KEY
        },
      });
      
      console.log("Edge function response:", result);
      setResponse(result);
      
      if (result.error) {
        console.error(`Edge function error:`, result.error);
        setLoading(false);
        throw new Error(`Edge Function Error: ${result.error.message || "Unknown error calling Edge Function"}`);
      }

      if (result.data && result.data.success && result.data.jobId) {
        setJobId(result.data.jobId);
        toast({
          title: "Job Started",
          description: `${label} card download has started. This process may take several minutes.`,
        });
      } else {
        setLoading(false);
        throw new Error(result.data?.error || "Unknown error occurred in the edge function response");
      }
    } catch (err: any) {
      console.error(`Error downloading ${source} cards:`, err);
      setLoading(false);
      
      let errorMessage = `Failed to download ${label} cards`;
      
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      if (err.message?.includes("Failed to fetch") || 
          err.message?.includes("NetworkError") ||
          err.message?.includes("network error") ||
          err.message?.includes("Failed to send")) {
        errorMessage = `Edge function 'download-tcg-cards' could not be reached. Please verify the function is deployed and running.`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = () => {
    if (!jobStatus) return "";
    
    switch (jobStatus.status) {
      case 'pending':
        return 'Waiting to start...';
      case 'downloading_data':
        return 'Downloading card data...';
      case 'processing_data':
        return `Saving card data (${jobStatus.processed_items}/${jobStatus.total_items})`;
      case 'downloading_images':
        return `Downloading card images (${jobStatus.processed_items}/${jobStatus.total_items})`;
      default:
        return jobStatus.status;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{setId ? `Download ${label} Set Cards` : `Download All ${label} Cards`}</CardTitle>
        <CardDescription>
          {setId 
            ? `Download card data and images for this ${label} set` 
            : `Download all available ${label} card data and images`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobId && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{getStatusLabel()}</span>
              <span>{jobProgress}%</span>
            </div>
            <Progress value={jobProgress} className="h-2" />
          </div>
        )}
        
        <Button 
          onClick={startDownload} 
          disabled={loading || !!jobId}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading || jobId ? (
            <LoadingSpinner size="sm" color="gray" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {jobId 
            ? `Downloading ${label} Cards...` 
            : loading 
              ? `Starting ${label} Download...` 
              : `Download ${label} Cards & Images`}
        </Button>
        
        <DebugInfo response={response} partitionInfo={null} />
      </CardContent>
    </Card>
  );
};

export default CardDownloadManager;
