
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Filter, Gamepad } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PokemonCardComponent from "@/components/sets/PokemonCardComponent";
import LoadingSpinner from "@/components/ui/loading-spinner";

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

interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  level?: string;
  hp?: string;
  types?: string[];
  evolves_from?: string;
  evolves_to?: string[];
  rules?: string[];
  attacks?: {
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }[];
  weaknesses?: {
    type: string;
    value: string;
  }[];
  resistances?: {
    type: string;
    value: string;
  }[];
  retreat_cost?: string[];
  converted_retreat_cost?: number;
  set: string;
  number: string;
  artist?: string;
  rarity?: string;
  national_pokedex_numbers?: number[];
  legalities?: {
    unlimited: string;
    standard: string;
    expanded: string;
  };
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updated_at: string;
    prices: Record<string, {
      low: number;
      mid: number;
      high: number;
      market: number;
      directLow: number;
    }>;
  };
}

const PokemonSetDetails = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [set, setSet] = useState<PokemonSet | null>(null);
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uniqueRarities, setUniqueRarities] = useState<string[]>([]);
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchSetDetails = async () => {
      if (!setId) return;
      
      setLoading(true);
      try {
        // 1. First fetch the set details
        const { data: setData, error: setError } = await supabase
          .from('pokemon_sets' as any)
          .select('*')
          .eq('set_id', setId)
          .single();
        
        if (setError) throw setError;
        
        setSet(setData as unknown as PokemonSet);
        
        // 2. Now fetch cards from the Pokémon TCG API
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&orderBy=number`);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        const fetchedCards = data.data as PokemonCard[];
        setCards(fetchedCards);
        setFilteredCards(fetchedCards);
        
        // Extract unique rarities and types for filters
        const rarities = Array.from(new Set(fetchedCards.map(card => card.rarity).filter(Boolean)));
        setUniqueRarities(rarities as string[]);
        
        const types = Array.from(new Set(
          fetchedCards.flatMap(card => card.types || [])
        )).sort();
        setUniqueTypes(types);
        
      } catch (error) {
        console.error("Error fetching set details:", error);
        toast({
          title: "Error",
          description: "Could not load set details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSetDetails();
  }, [setId, toast]);
  
  // Handle filtering of cards
  useEffect(() => {
    if (!cards.length) return;
    
    let filtered = [...cards];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(query) || 
        card.number.toLowerCase().includes(query)
      );
    }
    
    // Apply rarity filter
    if (rarityFilter !== "all") {
      filtered = filtered.filter(card => card.rarity === rarityFilter);
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(card => 
        card.types && card.types.includes(typeFilter)
      );
    }
    
    setFilteredCards(filtered);
  }, [searchQuery, rarityFilter, typeFilter, cards]);

  const resetFilters = () => {
    setSearchQuery("");
    setRarityFilter("all");
    setTypeFilter("all");
  };

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        {/* Back button and header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => navigate("/sets/pokemon")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Sets
          </Button>
          
          {loading ? (
            <div className="h-20 animate-pulse bg-gray-200 rounded-md"></div>
          ) : set ? (
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {set.logo_url && (
                <img 
                  src={set.logo_url} 
                  alt={`${set.name} logo`} 
                  className="h-24 object-contain"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Gamepad className="h-6 w-6 text-red-500" />
                  <h1 className="text-2xl font-bold">{set.name}</h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {set.series} Series • Released {new Date(set.release_date).toLocaleDateString()} • 
                  {set.total || set.printed_total} cards
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>Set not found</p>
            </div>
          )}
        </div>
        
        {/* Filters */}
        {!loading && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search cards by name or number..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <Select onValueChange={setRarityFilter} value={rarityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarities</SelectItem>
                    {uniqueRarities.map((rarity) => (
                      <SelectItem key={rarity} value={rarity}>
                        {rarity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select onValueChange={setTypeFilter} value={typeFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'} found
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs"
              >
                <Filter className="mr-2 h-3 w-3" />
                Reset Filters
              </Button>
            </div>
          </div>
        )}
        
        {/* Cards Display */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredCards.map((card) => (
              <PokemonCardComponent key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg font-medium">No cards matching your filters</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PokemonSetDetails;
