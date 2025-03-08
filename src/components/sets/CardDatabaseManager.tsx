
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DatabaseStats {
  pokemon_cards: number;
  mtg_cards: number;
  yugioh_cards: number;
  lorcana_cards: number;
  pokemon_images: number;
  mtg_images: number;
  yugioh_images: number;
  lorcana_images: number;
  loading: boolean;
}

const CardDatabaseManager: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats>({
    pokemon_cards: 0,
    mtg_cards: 0,
    yugioh_cards: 0,
    lorcana_cards: 0,
    pokemon_images: 0,
    mtg_images: 0,
    yugioh_images: 0,
    lorcana_images: 0,
    loading: true
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchDatabaseStats();
  }, []);
  
  const fetchDatabaseStats = async () => {
    setStats(prev => ({ ...prev, loading: true }));
    try {
      // Fetch card counts
      const pokemonCards = await fetchTableCount('pokemon_cards');
      const mtgCards = await fetchTableCount('mtg_cards');
      const yugiohCards = await fetchTableCount('yugioh_cards');
      const lorcanaCards = await fetchTableCount('lorcana_cards');
      
      // Fetch image counts
      const pokemonImages = await fetchImageCount('pokemon');
      const mtgImages = await fetchImageCount('mtg');
      const yugiohImages = await fetchImageCount('yugioh');
      const lorcanaImages = await fetchImageCount('lorcana');
      
      setStats({
        pokemon_cards: pokemonCards,
        mtg_cards: mtgCards,
        yugioh_cards: yugiohCards,
        lorcana_cards: lorcanaCards,
        pokemon_images: pokemonImages,
        mtg_images: mtgImages,
        yugioh_images: yugiohImages,
        lorcana_images: lorcanaImages,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching database stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch database statistics",
        variant: "destructive",
      });
      setStats(prev => ({ ...prev, loading: false }));
    }
  };
  
  const fetchTableCount = async (tableName: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error(`Error fetching count for ${tableName}:`, err);
      return 0;
    }
  };
  
  const fetchImageCount = async (game: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('tcg_image_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('game', game)
        .eq('status', 'completed');
        
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error(`Error fetching image count for ${game}:`, err);
      return 0;
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDatabaseStats();
    setRefreshing(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          TCG Card Database Statistics
        </CardTitle>
        <CardDescription>
          Track the number of cards and images stored in your local database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead className="text-right">Cards</TableHead>
                  <TableHead className="text-right">Images</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Pokémon TCG</TableCell>
                  <TableCell className="text-right">{stats.pokemon_cards.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{stats.pokemon_images.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Magic: The Gathering</TableCell>
                  <TableCell className="text-right">{stats.mtg_cards.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{stats.mtg_images.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Yu-Gi-Oh!</TableCell>
                  <TableCell className="text-right">{stats.yugioh_cards.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{stats.yugioh_images.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Disney Lorcana</TableCell>
                  <TableCell className="text-right">{stats.lorcana_cards.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{stats.lorcana_images.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={refreshing}
              >
                {refreshing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Stats
              </Button>
            </div>
            
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <Database className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Storage Usage</AlertTitle>
              <AlertDescription className="text-blue-700">
                Card images are stored in your Supabase Storage bucket 'tcg-images'. Make sure you have sufficient storage capacity
                for all the images you plan to download.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CardDatabaseManager;
