
import React from "react";
import { Progress } from "@/components/ui/progress";
import { JobStatus } from "@/hooks/useTCGSync";

interface JobStatusDisplayProps {
  jobStatus: JobStatus | null;
}

const JobStatusDisplay: React.FC<JobStatusDisplayProps> = ({ jobStatus }) => {
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
      progressValue = 95; // Almost done
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

export default JobStatusDisplay;
