
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
  const { toast } = useToast();

  const syncData = async () => {
    if (loading) return;
    
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
    } catch (err) {
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
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <LoadingSpinner size="sm" color={source === "pokemon" ? "red" : source === "mtg" ? "blue" : source === "yugioh" ? "purple" : "green"} />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {loading ? `Syncing ${label}...` : `Sync ${label} Data`}
      </Button>
      
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
