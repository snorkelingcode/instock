
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatabaseIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface CardDatabaseManagerProps {
  source: "pokemon" | "mtg" | "yugioh" | "lorcana";
  label: string;
}

const CardDatabaseManager: React.FC<CardDatabaseManagerProps> = ({ source, label }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();
  
  // Get database table name based on source
  const getTableName = () => {
    switch (source) {
      case "pokemon":
        return "pokemon_cards";
      case "mtg":
        return "mtg_cards";
      case "yugioh":
        return "yugioh_cards";
      case "lorcana":
        return "lorcana_cards";
      default:
        return "";
    }
  };
  
  // Calculate database stats
  const calculateStats = async () => {
    setLoading(true);
    const tableName = getTableName();
    
    try {
      // Get total count
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      
      // Get count of cards with local images
      const { count: localImagesCount, error: localImagesError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .not('local_image_urls', 'is', null);
        
      if (localImagesError) throw localImagesError;
      
      // Get number of sets
      const { data: setsData, error: setsError } = await supabase
        .from(tableName)
        .select('set_id')
        .is('set_id', 'not.null');
        
      if (setsError) throw setsError;
      
      // Count unique sets
      const uniqueSets = new Set();
      setsData.forEach((card: any) => {
        if (card.set_id) uniqueSets.add(card.set_id);
      });
      
      setStats({
        totalCards: count || 0,
        cardsWithImages: localImagesCount || 0,
        sets: uniqueSets.size,
      });
    } catch (error: any) {
      console.error("Error calculating stats:", error);
      toast({
        title: "Error",
        description: `Could not calculate database stats: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Clear the database
  const clearDatabase = async () => {
    const tableName = getTableName();
    setLoading(true);
    
    try {
      // Delete all records
      const { error } = await supabase
        .from(tableName)
        .delete()
        .neq('card_id', 'no-match'); // This is a workaround to delete all records
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `All ${label} cards have been deleted from the database`,
      });
      
      // Reset stats
      setStats({
        totalCards: 0,
        cardsWithImages: 0,
        sets: 0,
      });
    } catch (error: any) {
      console.error("Error clearing database:", error);
      toast({
        title: "Error",
        description: `Could not clear database: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Open the dialog and fetch stats
  const handleOpenDialog = () => {
    setOpenDialog(true);
    calculateStats();
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{label} Card Database</CardTitle>
        <CardDescription>
          Manage the {label} card database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleOpenDialog}
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
            >
              <DatabaseIcon className="h-4 w-4" />
              Manage {label} Database
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{label} Card Database</DialogTitle>
              <DialogDescription>
                View statistics and manage the {label} card database
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner size="lg" color={source === "pokemon" ? "red" : source === "mtg" ? "blue" : source === "yugioh" ? "purple" : "green"} />
                </div>
              ) : (
                <>
                  {stats && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-2xl font-bold">{stats.totalCards}</p>
                        <p className="text-xs text-muted-foreground">Total Cards</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-2xl font-bold">{stats.cardsWithImages}</p>
                        <p className="text-xs text-muted-foreground">With Images</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-2xl font-bold">{stats.sets}</p>
                        <p className="text-xs text-muted-foreground">Sets</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          Clear {label} Database
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all {label} cards from the database.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={clearDatabase} disabled={loading}>
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <LoadingSpinner size="sm" color="red" />
                                <span>Deleting...</span>
                              </div>
                            ) : (
                              "Yes, delete all cards"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button variant="secondary" onClick={calculateStats} disabled={loading}>
                      Refresh Stats
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CardDatabaseManager;
