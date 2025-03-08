
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import JobStatusDisplay from "./JobStatusDisplay";
import DebugInfo from "./DebugInfo";
import { useTCGSync } from "@/hooks/useTCGSync";
import { formatTimeRemaining } from "@/utils/cacheUtils";

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
  const {
    loading,
    cooldown,
    timeRemaining,
    partitionInfo,
    edgeFunctionResponse,
    jobStatus,
    currentJobId,
    syncData
  } = useTCGSync({ source, label, onSuccess });

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
      
      <JobStatusDisplay jobStatus={jobStatus} />
      
      <DebugInfo 
        response={edgeFunctionResponse} 
        partitionInfo={partitionInfo} 
      />
    </div>
  );
};

export default ApiSyncButton;
