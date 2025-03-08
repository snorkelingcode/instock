
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, Search, Filter } from "lucide-react";
import Layout from "@/components/layout/Layout";
import PokemonCardComponent from "@/components/sets/PokemonCardComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PokemonSetDetails = () => {
  const { setId } = useParams<{ setId: string }>();
  const [set, setSet] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [filteredCards, setFilteredCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [uniqueRarities, setUniqueRarities] = useState<string[]>([]);

  useEffect(() => {
    const fetchSetDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pokemon_sets')
          .select('*')
          .eq('set_id', setId)
          .single();

        if (error) throw error;
        setSet(data);
      } catch (error) {
        console.error('Error fetching set details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (setId) {
      fetchSetDetails();
    }
  }, [setId]);

  useEffect(() => {
    const fetchCards = async () => {
      setLoadingCards(true);
      try {
        // Try to fetch cards from our database first
        const { data: dbCards, error: dbError } = await supabase
          .from('pokemon_cards')
          .select('*')
          .eq('set_id', setId)
          .order('number');

        if (!dbError && dbCards && dbCards.length > 0) {
          // We have cards in our database
          console.log(`Found ${dbCards.length} cards in database`);
          
          // Process the cards to match the expected format
          const processedCards = dbCards.map(card => ({
            ...card,
            images: card.images ? JSON.parse(typeof card.images === 'string' ? card.images : JSON.stringify(card.images)) : null,
            attacks: card.attacks ? JSON.parse(typeof card.attacks === 'string' ? card.attacks : JSON.stringify(card.attacks)) : null,
            weaknesses: card.weaknesses ? JSON.parse(typeof card.weaknesses === 'string' ? card.weaknesses : JSON.stringify(card.weaknesses)) : null,
            resistances: card.resistances ? JSON.parse(typeof card.resistances === 'string' ? card.resistances : JSON.stringify(card.resistances)) : null,
            set: { id: card.set_id }
          }));
          
          setCards(processedCards);
          setFilteredCards(processedCards);
          
          // Extract unique rarities for filtering
          const rarities = Array.from(new Set(processedCards
            .map(card => card.rarity)
            .filter(rarity => rarity)
          )).sort();
          setUniqueRarities(rarities);
          
          setLoadingCards(false);
          return;
        }
        
        // If no cards in database, fall back to API
        console.log("No cards found in database, using API fallback");
        const apiKey = 'a9394cef-34e4-491c-9bab-65bfea95e064';
        
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`, {
          headers: {
            'X-Api-Key': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract unique rarities for filtering
        const rarities = Array.from(new Set(data.data
          .map((card: any) => card.rarity)
          .filter((rarity: string) => rarity)
        )).sort();
        setUniqueRarities(rarities);
        
        setCards(data.data);
        setFilteredCards(data.data);
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoadingCards(false);
      }
    };

    if (setId) {
      fetchCards();
    }
  }, [setId]);

  // Filter cards based on search query and rarity filter
  useEffect(() => {
    let filtered = cards;
    
    // Apply rarity filter
    if (rarityFilter !== "all") {
      filtered = filtered.filter((card: any) => card.rarity === rarityFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((card: any) => 
        (card.name?.toLowerCase().includes(query)) || 
        (card.id?.toLowerCase().includes(query)) ||
        (card.card_id?.toLowerCase().includes(query)) ||
        (card.number?.toLowerCase().includes(query))
      );
    }
    
    setFilteredCards(filtered);
  }, [searchQuery, rarityFilter, cards]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRarityFilterChange = (value: string) => {
    setRarityFilter(value);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-full max-w-md mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton key={item} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!set) {
    return (
      <Layout>
        <div className="container py-6">
          <h1 className="text-2xl font-bold mb-4">Set Not Found</h1>
          <p>The set you are looking for does not exist or there was an error loading it.</p>
          <Button asChild className="mt-4">
            <Link to="/pokemon-sets">Back to Sets</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/pokemon-sets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Sets
          </Link>
        </Button>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg p-4">
                <img
                  src={set.images_url || set.logo_url || set.symbol_url}
                  alt={`${set.name} symbol`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{set.name}</h1>
                <p className="text-gray-600 mb-2">Series: {set.series}</p>
                <p className="text-gray-600 mb-2">Released: {set.release_date ? new Date(set.release_date).toLocaleDateString() : 'Unknown'}</p>
                <p className="text-gray-600 mb-2">Cards: {set.printed_total || set.total || '?'}</p>
                <div className="flex gap-2 mt-4">
                  <Button asChild variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                    <a
                      href={`https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(set.name)}&view=grid`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Shop on TCGPlayer <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                    <a
                      href={`https://www.cardmarket.com/en/Pokemon/Products/Singles?searchString=${encodeURIComponent(set.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Shop on Cardmarket <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Cards in this Set</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search cards by name or number..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            {uniqueRarities.length > 0 && (
              <div className="w-full md:w-64">
                <Select onValueChange={handleRarityFilterChange} defaultValue="all">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarities</SelectItem>
                    {uniqueRarities.map(rarity => (
                      <SelectItem key={rarity} value={rarity}>
                        {rarity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'} found
            </p>
            
            {(searchQuery || rarityFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setRarityFilter("all");
                }}
                className="text-xs"
              >
                <Filter className="mr-2 h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {loadingCards ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <p>No cards found matching your filters.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCards.map((card) => (
              <PokemonCardComponent 
                key={card.card_id || card.id} 
                card={card} 
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PokemonSetDetails;
