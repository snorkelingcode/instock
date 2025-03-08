
import React from "react";

interface DebugInfoProps {
  response: any;
  partitionInfo: any;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ response, partitionInfo }) => {
  return (
    <div className="text-xs text-gray-500 mt-1">
      <p>Images will be downloaded and stored locally in Supabase.</p>
      {partitionInfo && (
        <p className="mt-1">
          TCG Partition: {(partitionInfo.size / 1024).toFixed(2)}KB cached, 
          Last updated: {new Date(partitionInfo.lastUpdated).toLocaleString()}
        </p>
      )}
      
      {response && (
        <div className="text-xs text-gray-500 mt-1">
          <details>
            <summary>Debug Info</summary>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32 text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;
