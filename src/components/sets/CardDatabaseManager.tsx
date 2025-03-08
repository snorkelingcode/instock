
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, Database, DownloadCloud, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import CardDownloadManager from "./CardDownloadManager";
import { Badge } from "@/components/ui/badge";

interface CardDatabaseStats {
  pokemon_cards: number;
  mtg_cards: number;
  yugioh_cards: number;
  lorcana_cards: number;
  tcg_image_downloads: number;
  images_success: number;
  images_failed: number;
  storage_size_kb: number;
}

const CardDatabaseManager = () => {
  const [stats, setStats] = useState<CardDatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  const fetchDatabaseStats = async () => {
    setLoading(true);
    try {
      // Get counts from each table
      const [
        pokemonResult,
        mtgResult,
        yugiohResult,
        lorcanaResult,
        imagesResult,
        imagesSuccessResult,
        imagesFailedResult,
        activeJobsResult
      ] = await Promise.all([
        supabase.from('pokemon_cards').select('id', { count: 'exact', head: true }),
        supabase.from('mtg_cards').select('id', { count: 'exact', head: true }),
        supabase.from('yugioh_cards').select('id', { count: 'exact', head: true }),
        supabase.from('lorcana_cards').select('id', { count: 'exact', head: true }),
        supabase.from('tcg_image_downloads').select('id', { count: 'exact', head: true }),
        supabase.from('tcg_image_downloads').select('id', { count: 'exact', head: true }).eq('status', 'success'),
        supabase.from('tcg_image_downloads').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('tcg_download_jobs').select('*').not('status', 'in', '("completed","failed")').order('created_at', { ascending: false })
      ]);

      // Get storage size (this is approximate since we can't get exact bucket size)
      const { data: storageData } = await supabase.storage.from('tcg-images').list();
      
      // Estimate storage size (very rough estimate)
      const estimatedSizeKb = (imagesSuccessResult.count || 0) * 150; // Assuming average 150KB per image
      
      setStats({
        pokemon_cards: pokemonResult.count || 0,
        mtg_cards: mtgResult.count || 0,
        yugioh_cards: yugiohResult.count || 0,
        lorcana_cards: lorcanaResult.count || 0,
        tcg_image_downloads: imagesResult.count || 0,
        images_success: imagesSuccessResult.count || 0,
        images_failed: imagesFailedResult.count || 0,
        storage_size_kb: estimatedSizeKb
      });
      
      setActiveJobs(activeJobsResult.data || []);
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
    
    // Set up a refresh interval
    const interval = setInterval(fetchDatabaseStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatFileSize = (sizeInKb: number): string => {
    if (sizeInKb < 1024) {
      return `${sizeInKb.toFixed(2)} KB`;
    } else if (sizeInKb < 1024 * 1024) {
      return `${(sizeInKb / 1024).toFixed(2)} MB`;
    } else {
      return `${(sizeInKb / (1024 * 1024)).toFixed(2)} GB`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Card Database Statistics
          </CardTitle>
          <CardDescription>
            Overview of stored TCG cards and images in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading database statistics...</div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Pokémon Cards" value={stats.pokemon_cards.toLocaleString()} color="bg-red-50 text-red-700" />
              <StatCard title="MTG Cards" value={stats.mtg_cards.toLocaleString()} color="bg-blue-50 text-blue-700" />
              <StatCard title="Yu-Gi-Oh! Cards" value={stats.yugioh_cards.toLocaleString()} color="bg-purple-50 text-purple-700" />
              <StatCard title="Lorcana Cards" value={stats.lorcana_cards.toLocaleString()} color="bg-green-50 text-green-700" />
              
              <StatCard 
                title="Total Images" 
                value={stats.tcg_image_downloads.toLocaleString()} 
                color="bg-gray-50 text-gray-700"
              />
              <StatCard 
                title="Successful Images" 
                value={stats.images_success.toLocaleString()} 
                color="bg-emerald-50 text-emerald-700"
              />
              <StatCard 
                title="Failed Images" 
                value={stats.images_failed.toLocaleString()} 
                color="bg-yellow-50 text-yellow-700"
              />
              <StatCard 
                title="Storage Used" 
                value={formatFileSize(stats.storage_size_kb)} 
                color="bg-indigo-50 text-indigo-700"
              />
            </div>
          ) : (
            <div className="text-center py-4">No statistics available</div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="sm" variant="outline" onClick={fetchDatabaseStats}>
            Refresh Stats
          </Button>
        </CardFooter>
      </Card>
      
      {activeJobs.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200 mb-6">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Active Download Jobs</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="mt-2 space-y-2">
              {activeJobs.map(job => (
                <div key={job.id} className="bg-white p-3 rounded-md border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline" className="mb-1 capitalize">
                        {job.game}
                      </Badge>
                      <div className="text-sm font-medium">{job.job_type === 'set_cards' ? 'Set Download' : 'Full Download'}</div>
                      <div className="text-xs text-gray-500">
                        Started {new Date(job.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium capitalize">{job.status.replace('_', ' ')}</div>
                      <div className="text-xs">
                        {job.processed_items} / {job.total_items || '?'} items
                        {job.total_items > 0 && (
                          <span className="ml-1">
                            ({Math.round((job.processed_items / job.total_items) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="pokemon">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="pokemon">Pokémon</TabsTrigger>
          <TabsTrigger value="mtg">Magic</TabsTrigger>
          <TabsTrigger value="yugioh">Yu-Gi-Oh!</TabsTrigger>
          <TabsTrigger value="lorcana">Lorcana</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pokemon">
          <CardDownloadManager source="pokemon" label="Pokémon" />
        </TabsContent>
        
        <TabsContent value="mtg">
          <CardDownloadManager source="mtg" label="Magic: The Gathering" />
        </TabsContent>
        
        <TabsContent value="yugioh">
          <CardDownloadManager source="yugioh" label="Yu-Gi-Oh!" />
        </TabsContent>
        
        <TabsContent value="lorcana">
          <CardDownloadManager source="lorcana" label="Disney Lorcana" />
        </TabsContent>
      </Tabs>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Database Information</AlertTitle>
        <AlertDescription>
          This tool downloads card data and images from various TCG APIs and stores them in your Supabase database and storage.
          This allows your application to work offline and reduces dependency on external APIs.
          The download process may take several minutes for each TCG, especially when downloading images.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Simple stat card component
const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  <div className={`${color} p-4 rounded-lg text-center`}>
    <h3 className="text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default CardDatabaseManager;
