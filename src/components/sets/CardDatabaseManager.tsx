
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Database, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";

const CardDatabaseManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();
  
  const ACCESS_KEY = "TCG-SYNC-ACCESS-2024";
  
  useEffect(() => {
    fetchDatabaseStats();
  }, []);
  
  const fetchDatabaseStats = async () => {
    setRefreshing(true);
    try {
      const statsData = {
        pokemon: await getTableCount('pokemon_cards'),
        mtg: await getTableCount('mtg_cards'),
        yugioh: await getTableCount('yugioh_cards'),
        lorcana: await getTableCount('lorcana_cards'),
        images: await getTableCount('tcg_image_downloads')
      };
      
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching database stats:", error);
      toast({
        title: "Error",
        description: "Failed to load database statistics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  const getTableCount = async (tableName: string) => {
    try {
      const { count, error } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error(`Error counting table ${tableName}:`, error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error(`Error counting table ${tableName}:`, error);
      return 0;
    }
  };
  
  const clearDatabase = async () => {
    setLoading(true);
    try {
      const isAuthenticated = localStorage.getItem("syncPageAuthenticated") === "true";
      
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You need to be authenticated to perform this action",
          variant: "destructive",
        });
        return;
      }
      
      await supabase.from('tcg_image_downloads' as any).delete().neq('id', 0);
      await supabase.from('pokemon_cards' as any).delete().neq('id', 0);
      await supabase.from('mtg_cards' as any).delete().neq('id', 0);
      await supabase.from('yugioh_cards' as any).delete().neq('id', 0);
      await supabase.from('lorcana_cards' as any).delete().neq('id', 0);
      
      toast({
        title: "Success",
        description: "Card database cleared successfully",
      });
      
      fetchDatabaseStats();
    } catch (error) {
      console.error("Error clearing database:", error);
      toast({
        title: "Error",
        description: "Failed to clear database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> Card Database Management
        </CardTitle>
        <CardDescription>
          View and manage your local TCG card database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDatabaseStats}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <LoadingSpinner size="sm" color="gray" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Stats
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all TCG card data from your database.
                  This includes all card data and image records for all TCGs.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={clearDatabase}
                  disabled={loading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="red" />
                  ) : (
                    "Yes, Clear Everything"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Game</TableHead>
              <TableHead className="text-right">Cards</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats ? (
              <>
                <TableRow>
                  <TableCell className="font-medium">Pokémon TCG</TableCell>
                  <TableCell className="text-right">{stats.pokemon.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Magic: The Gathering</TableCell>
                  <TableCell className="text-right">{stats.mtg.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Yu-Gi-Oh!</TableCell>
                  <TableCell className="text-right">{stats.yugioh.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Disney Lorcana</TableCell>
                  <TableCell className="text-right">{stats.lorcana.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Stored Images</TableCell>
                  <TableCell className="text-right">{stats.images.toLocaleString()}</TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  {refreshing ? (
                    <div className="flex justify-center">
                      <LoadingSpinner size="md" color="gray" />
                    </div>
                  ) : (
                    "No data available"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CardDatabaseManager;
