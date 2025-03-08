import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SetCard from "@/components/sets/SetCard";
import { Gamepad, Filter, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PokemonSet {
  id: number;
  set_id: string;
  name: string;
  series: string;
  printed_total: number;
  total: number;
  release_date: string;
  symbol_url: string;
  logo_url: string;
  images_url: string;
}

const PokemonSets = () => {
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [filteredSets, setFilteredSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [uniqueSeries, setUniqueSeries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching Pokemon sets data...");
        
        const { data, error } = await supabase
          .from('pokemon_sets')
          .select('*')
          .order('release_date', { ascending: false });

        if (error) {
          console.error('Error fetching Pokémon sets:', error);
          setError(`Failed to load Pokémon sets: ${error.message}`);
          throw error;
        }

        console.log("Pokemon sets data received:", data);
        
        // Using a safer type casting approach
        const fetchedData = data || [];
        const typedSets = fetchedData as unknown as PokemonSet[];
        setSets(typedSets);

        // Extract unique series for filter dropdown
        const seriesArray = Array.from(new Set(typedSets.map(set => set.series))).sort();
        setUniqueSeries(seriesArray);
        
        // Initialize with all sets
        setFilteredSets(typedSets);
      } catch (error) {
        console.error('Error fetching Pokémon sets:', error);
        toast({
          title: "Error",
          description: "Failed to load Pokémon sets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [toast]);

  // Filter sets based on search query and series filter
  useEffect(() => {
    let filtered = sets;
    
    // Apply series filter
    if (seriesFilter !== "all") {
      filtered = filtered.filter(set => set.series === seriesFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(set => 
        set.name.toLowerCase().includes(query) || 
        set.set_id.toLowerCase().includes(query)
      );
    }
    
    setFilteredSets(filtered);
  }, [searchQuery, seriesFilter, sets]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSeriesFilterChange = (value: string) => {
    setSeriesFilter(value);
  };

  const handleSync = () => {
    navigate('/sets/sync');
  };

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Gamepad className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold">Pokémon TCG Sets</h1>
        </div>
        <p className="text-gray-700 mb-6">
          Browse all Pokémon Trading Card Game sets, sorted by release date. Click on a set to view all cards in that set.
        </p>
        
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search sets..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select onValueChange={handleSeriesFilterChange} defaultValue="all">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Series</SelectItem>
                  {uniqueSeries.map(series => (
                    <SelectItem key={series} value={series}>
                      {series}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredSets.length} {filteredSets.length === 1 ? 'set' : 'sets'} found
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSeriesFilter("all");
                }}
                className="text-xs"
              >
                <Filter className="mr-2 h-3 w-3" />
                Reset Filters
              </Button>
              
              {sets.length === 0 && !loading && (
                <Button 
                  size="sm" 
                  className="text-xs bg-red-500 hover:bg-red-600"
                  onClick={handleSync}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Sync Data
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <Button 
              onClick={handleSync} 
              variant="destructive" 
              size="sm" 
              className="mt-2"
            >
              Go to Sync Page
            </Button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-xl">Loading Pokémon sets...</div>
          </div>
        ) : filteredSets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSets.map((set) => (
              <SetCard
                key={set.set_id}
                id={set.set_id}
                name={set.name}
                imageUrl={set.logo_url || set.images_url || set.symbol_url}
                releaseDate={set.release_date}
                totalCards={set.total || set.printed_total}
                description={`${set.series} Series • ${set.total || set.printed_total} Cards`}
                category="pokemon"
                color="#E53E3E"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <p>No Pokémon sets found. You may need to sync the data first.</p>
            <Button 
              onClick={handleSync} 
              variant="default" 
              className="bg-red-500 hover:bg-red-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Go to Sync Page
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PokemonSets;
