import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import ApiSyncButton from "@/components/sets/ApiSyncButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, ShieldAlert } from "lucide-react";
import SyncPageAuth from "@/components/sets/SyncPageAuth";
import { getRateLimitTimeRemaining, formatTimeRemaining } from "@/utils/cacheUtils";

interface ApiConfig {
  api_name: string;
  last_sync_time: string;
  sync_frequency: string;
}

const SetSyncPage = () => {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  
  const fetchApiConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_config' as any)
        .select('*');

      if (error) {
        throw error;
      }

      // Using a safer type casting approach
      const fetchedData = data || [];
      setApiConfigs(fetchedData as unknown as ApiConfig[]);
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
    if (isAuthenticated) {
      fetchApiConfigs();
      
      // Set up a timer to refresh API configs every 30 seconds
      const refreshInterval = setInterval(fetchApiConfigs, 30000);
      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated]);

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

  // Get the time since last sync
  const getTimeSinceLastSync = (apiName: string) => {
    const config = apiConfigs.find(c => c.api_name === apiName);
    if (!config?.last_sync_time) return 'N/A';
    
    const lastSync = new Date(config.last_sync_time);
    const now = new Date();
    const timeDiff = now.getTime() - lastSync.getTime();
    
    // If less than a minute, show seconds
    if (timeDiff < 60000) {
      return `${Math.floor(timeDiff / 1000)} seconds ago`;
    }
    
    // If less than an hour, show minutes
    if (timeDiff < 3600000) {
      return `${Math.floor(timeDiff / 60000)} minutes ago`;
    }
    
    // If less than a day, show hours
    if (timeDiff < 86400000) {
      return `${Math.floor(timeDiff / 3600000)} hours ago`;
    }
    
    // Otherwise show days
    return `${Math.floor(timeDiff / 86400000)} days ago`;
  };

  // Get the rate limit status for a specific API
  const getRateLimitStatus = (apiName: string) => {
    const timeRemaining = getRateLimitTimeRemaining(`sync_${apiName}`);
    if (timeRemaining > 0) {
      return `Rate limited for ${formatTimeRemaining(timeRemaining)}`;
    }
    
    // Check when it was last synced to determine if it's "Ready" or "Recently synced"
    const config = apiConfigs.find(c => c.api_name === apiName);
    if (config?.last_sync_time) {
      const lastSync = new Date(config.last_sync_time);
      const now = new Date();
      const timeDiff = now.getTime() - lastSync.getTime();
      
      // If synced within the last 5 minutes, show "Recently synced"
      if (timeDiff < 300000) {
        return 'Recently synced';
      }
    }
    
    return 'Ready to sync';
  };

  // Get the status color for the rate limit
  const getRateLimitStatusColor = (apiName: string) => {
    const timeRemaining = getRateLimitTimeRemaining(`sync_${apiName}`);
    if (timeRemaining > 0) {
      return 'text-yellow-600';
    }
    
    // Check when it was last synced
    const config = apiConfigs.find(c => c.api_name === apiName);
    if (config?.last_sync_time) {
      const lastSync = new Date(config.last_sync_time);
      const now = new Date();
      const timeDiff = now.getTime() - lastSync.getTime();
      
      // If synced within the last 5 minutes, show blue
      if (timeDiff < 300000) {
        return 'text-blue-600';
      }
    }
    
    return 'text-green-600';
  };

  // Handle successful authentication
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  // If not authenticated, show the auth form
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-2xl font-bold mb-4">TCG Data Synchronization</h1>
          <SyncPageAuth onAuthenticated={handleAuthenticated} />
        </div>
      </Layout>
    );
  }

  // If authenticated, show the sync page content
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
        
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <ShieldAlert className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Rate Limiting Enabled</AlertTitle>
          <AlertDescription className="text-yellow-700">
            To prevent API abuse, synchronization operations are limited to once per minute for each TCG.
            This helps ensure fair usage of external APIs and prevents unnecessary load on your database.
            Rate limits are enforced both client-side and server-side for maximum protection.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pokémon TCG</CardTitle>
              <CardDescription>Sync Pokémon TCG sets data from the official Pokémon TCG API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <div><strong>Last Sync:</strong> {getLastSyncTime('pokemon')}</div>
                <div><strong>Time Since Sync:</strong> {getTimeSinceLastSync('pokemon')}</div>
                <div><strong>Status:</strong> <span className={getRateLimitStatusColor('pokemon')}>
                  {getRateLimitStatus('pokemon')}
                </span></div>
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
              <div className="text-sm space-y-1">
                <div><strong>Last Sync:</strong> {getLastSyncTime('mtg')}</div>
                <div><strong>Time Since Sync:</strong> {getTimeSinceLastSync('mtg')}</div>
                <div><strong>Status:</strong> <span className={getRateLimitStatusColor('mtg')}>
                  {getRateLimitStatus('mtg')}
                </span></div>
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
              <div className="text-sm space-y-1">
                <div><strong>Last Sync:</strong> {getLastSyncTime('yugioh')}</div>
                <div><strong>Time Since Sync:</strong> {getTimeSinceLastSync('yugioh')}</div>
                <div><strong>Status:</strong> <span className={getRateLimitStatusColor('yugioh')}>
                  {getRateLimitStatus('yugioh')}
                </span></div>
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
              <div className="text-sm space-y-1">
                <div><strong>Last Sync:</strong> {getLastSyncTime('lorcana')}</div>
                <div><strong>Time Since Sync:</strong> {getTimeSinceLastSync('lorcana')}</div>
                <div><strong>Status:</strong> <span className={getRateLimitStatusColor('lorcana')}>
                  {getRateLimitStatus('lorcana')}
                </span></div>
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
