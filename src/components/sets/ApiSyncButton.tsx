
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
  const { toast } = useToast();

  const syncData = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log(`Starting ${source} data sync...`);
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('fetch-tcg-sets', {
        body: { source },
      });

      if (error) {
        console.error(`Edge function error:`, error);
        throw new Error(error.message || "Error calling Edge Function");
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
        throw new Error(data?.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error(`Error syncing ${source} data:`, err);
      toast({
        title: "Error",
        description: `Failed to sync ${label} data: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
};

export default ApiSyncButton;
