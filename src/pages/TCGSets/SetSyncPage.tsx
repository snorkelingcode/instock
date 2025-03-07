
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import ApiSyncButton from "@/components/sets/ApiSyncButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ApiConfig {
  api_name: string;
  last_sync_time: string;
  sync_frequency: string;
}

const SetSyncPage = () => {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_config')
        .select('*');

      if (error) {
        throw error;
      }

      setApiConfigs(data || []);
    } catch (error) {
      console.error('Error fetching API configs:', error);
      toast({
        title: "Error",
        description: "Failed to load API configuration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiConfigs();
  }, [toast]);

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get the last sync time for a specific API
  const getLastSyncTime = (apiName: string) => {
    const config = apiConfigs.find(c => c.api_name === apiName);
    return formatLastSyncTime(config?.last_sync_time || null);
  };

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-4">TCG Data Synchronization</h1>
        <p className="text-gray-700 mb-6">
          Use this page to manually sync TCG data from external APIs. The data will be stored in your Supabase database for display on the TCG Sets pages.
        </p>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>API Keys Required</AlertTitle>
          <AlertDescription>
            For this feature to work properly, you need to set up the API keys in your Supabase Edge Function environment variables.
            These include: POKEMON_TCG_API_KEY and MTG_API_KEY.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pokémon TCG</CardTitle>
              <CardDescription>Sync Pokémon TCG sets data from the official Pokémon TCG API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <strong>Last Sync:</strong> {getLastSyncTime('pokemon')}
              </div>
              <ApiSyncButton 
                source="pokemon" 
                label="Pokémon TCG" 
                onSuccess={fetchApiConfigs}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Magic: The Gathering</CardTitle>
              <CardDescription>Sync MTG sets data from the magicthegathering.io API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <strong>Last Sync:</strong> {getLastSyncTime('mtg')}
              </div>
              <ApiSyncButton 
                source="mtg" 
                label="MTG" 
                onSuccess={fetchApiConfigs}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Yu-Gi-Oh!</CardTitle>
              <CardDescription>Sync Yu-Gi-Oh! sets data from the YGOPRODeck API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <strong>Last Sync:</strong> {getLastSyncTime('yugioh')}
              </div>
              <ApiSyncButton 
                source="yugioh" 
                label="Yu-Gi-Oh!" 
                onSuccess={fetchApiConfigs}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Disney Lorcana</CardTitle>
              <CardDescription>Add Disney Lorcana sets to the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <strong>Last Sync:</strong> {getLastSyncTime('lorcana')}
              </div>
              <ApiSyncButton 
                source="lorcana" 
                label="Disney Lorcana" 
                onSuccess={fetchApiConfigs}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SetSyncPage;
