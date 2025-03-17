
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import SetCard from "@/components/sets/SetCard";
import { Gamepad, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePokemonSets } from "@/hooks/useTCGSets";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem,
  PaginationLink,
  PaginationNext
} from "@/components/ui/pagination";

const PokemonSets = () => {
  const { 
    sets, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    loadMore 
  } = usePokemonSets({ initialChunkSize: 24, additionalChunkSize: 24 });
  
  const [filteredSets, setFilteredSets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [uniqueSeries, setUniqueSeries] = useState<string[]>([]);
  const { toast } = useToast();

  // Extract unique series for filter dropdown
  useEffect(() => {
    if (sets.length > 0) {
      const seriesArray = Array.from(new Set(sets.map(set => set.series))).sort();
      setUniqueSeries(seriesArray);
    }
  }, [sets]);

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

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(12).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="flex flex-col space-y-3">
        <Skeleton className="h-48 w-full bg-gray-200" />
        <Skeleton className="h-6 w-3/4 bg-gray-200" />
        <Skeleton className="h-4 w-1/2 bg-gray-200" />
        <Skeleton className="h-4 w-5/6 bg-gray-200" />
        <Skeleton className="h-10 w-full bg-gray-200" />
      </div>
    ));
  };

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load Pokémon sets",
      variant: "destructive",
    });
  }

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
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {renderSkeletons()}
          </div>
        ) : filteredSets.length > 0 ? (
          <>
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
            
            {hasMore && !seriesFilter && !searchQuery && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button 
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="w-full"
                      >
                        {loadingMore ? "Loading..." : "Load More Sets"}
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p>No Pokémon sets found matching your filters.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PokemonSets;
