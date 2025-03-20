
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { 
  fetchPokemonCards, 
  PokemonCard, 
  fetchPokemonSets, 
  PokemonSet,
  preloadCardImages,
  getCachedSetMetadata,
  prefetchPokemonSet,
  sortCardsByNumber
} from "@/utils/pokemon-cards";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyStateHandler from "@/components/ui/empty-state-handler";
import { getCache, setCache } from "@/utils/cacheUtils";
import { Progress } from "@/components/ui/progress";

const VISITED_SETS_CACHE_KEY = "pokemon_visited_sets";

const PokemonSetDetails = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [set, setSet] = useState<PokemonSet | null>(null);
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<PokemonCard[]>([]);
  const [loadingSet, setLoadingSet] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uniqueRarities, setUniqueRarities] = useState<string[]>([]);
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
  const [isLoadingError, setIsLoadingError] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [secretRares, setSecretRares] = useState<PokemonCard[]>([]);
  const [hasSecretRares, setHasSecretRares] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(5);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [isPrefetched, setIsPrefetched] = useState(false);
  const [isSetVisited, setIsSetVisited] = useState(false);
  const [batchAnimation, setBatchAnimation] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const cardListToDisplay = isFiltering ? filteredCards : cards;

  useEffect(() => {
    if (!setId) return;
    
    const visitedSets = getCache<string[]>(VISITED_SETS_CACHE_KEY) || [];
    const hasVisited = visitedSets.includes(setId);
    
    setIsSetVisited(hasVisited);
    setBatchAnimation(hasVisited);
    
    if (!hasVisited) {
      const updatedVisits = [...visitedSets, setId];
      setCache(VISITED_SETS_CACHE_KEY, updatedVisits, 60 * 24);
    }
  }, [setId]);

  useEffect(() => {
    const updateCardsPerRow = () => {
      if (window.innerWidth >= 1280) {
        setCardsPerRow(5);
      } else if (window.innerWidth >= 1024) {
        setCardsPerRow(4);
      } else if (window.innerWidth >= 768) {
        setCardsPerRow(3);
      } else if (window.innerWidth >= 640) {
        setCardsPerRow(2);
      } else {
        setCardsPerRow(1);
      }
    };

    updateCardsPerRow();

    window.addEventListener('resize', updateCardsPerRow);
    return () => window.removeEventListener('resize', updateCardsPerRow);
  }, []);

  useEffect(() => {
    if (!setId || isPrefetched) return;
    
    const fetchSetImmediately = async () => {
      setIsPrefetched(true);
      try {
        await prefetchPokemonSet(setId);
      } catch (e) {
        console.warn("Failed to prefetch set:", e);
      }
    };
    
    fetchSetImmediately();
  }, [setId, isPrefetched]);

  useEffect(() => {
    if (!setId || metadataLoaded) return;
    
    const metadata = getCachedSetMetadata(setId);
    if (metadata) {
      console.log(`Using cached metadata for set ${setId}:`, metadata);
      setHasSecretRares(metadata.hasSecretRares);
      setMetadataLoaded(true);
    }
  }, [setId, metadataLoaded]);

  useEffect(() => {
    const fetchSetDetails = async () => {
      if (!setId) return;
      
      setLoadingSet(true);
      
      try {
        const allSets = await fetchPokemonSets();
        const currentSet = allSets.find(s => s.set_id === setId);
        
        if (!currentSet) {
          throw new Error("Set not found");
        }
        
        setSet(currentSet);
      } catch (error) {
        console.error("Error fetching set details:", error);
        toast({
          title: "Error",
          description: "Could not load set details",
          variant: "destructive",
        });
      } finally {
        setLoadingSet(false);
      }
    };
    
    fetchSetDetails();
  }, [setId, toast]);
  
  useEffect(() => {
    const fetchAllCards = async () => {
      if (!setId) return;
      
      setLoadingCards(true);
      setIsLoadingError(false);
      setLoadProgress(0);
      
      try {
        console.log(`Fetching all cards for set: ${setId}`);
        
        const progressTimer = setInterval(() => {
          setLoadProgress(prev => {
            const newProgress = prev + (90 - prev) * 0.1;
            return Math.min(newProgress, 90);
          });
        }, 300);
        
        const result = await fetchPokemonCards(setId, { loadAll: true });
        
        clearInterval(progressTimer);
        setLoadProgress(100);
        
        const fetchedCards = result.cards;
        console.log(`Received ${fetchedCards.length} cards for set ${setId}`);
        
        const sortedCards = sortCardsByNumber(fetchedCards);
        
        preloadCardImages(sortedCards, isSetVisited ? 100 : 50);
        
        setCards(sortedCards);
        
        if (set) {
          const printedTotal = set.printed_total || set.total || 0;
          const secretRaresFound = sortedCards.filter(card => {
            const cardNumber = parseInt(card.number.match(/^\d+/)?.[0] || '0', 10);
            return cardNumber > printedTotal;
          });
          
          setSecretRares(secretRaresFound);
          setHasSecretRares(secretRaresFound.length > 0);
          
          if (secretRaresFound.length > 0) {
            console.log(`Found ${secretRaresFound.length} secret rares in set ${setId}`);
          }
        }
        
        const raritiesSet = new Set<string>();
        const typesSet = new Set<string>();
        
        sortedCards.forEach(card => {
          if (card.rarity) raritiesSet.add(card.rarity);
          if (card.types) card.types.forEach(type => typesSet.add(type));
        });
        
        setUniqueRarities(Array.from(raritiesSet));
        setUniqueTypes(Array.from(typesSet).sort());
        
      } catch (cardsError) {
        console.error("Error fetching cards:", cardsError);
        toast({
          title: "Error",
          description: "There was an issue loading the cards. Please try again.",
          variant: "destructive",
        });
        setIsLoadingError(true);
      } finally {
        setLoadingCards(false);
      }
    };
    
    fetchAllCards();
  }, [setId, toast, set, isSetVisited]);

  const applyFilters = useCallback(() => {
    if (rarityFilter === "all" && typeFilter === "all" && !searchQuery) {
      setIsFiltering(false);
      return;
    }
    
    setIsFiltering(true);
    
    let filtered = [...cards];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(query) || 
        card.number.toLowerCase().includes(query)
      );
    }
    
    if (rarityFilter !== "all") {
      filtered = filtered.filter(card => card.rarity === rarityFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(card => 
        card.types && card.types.includes(typeFilter)
      );
    }
    
    setFilteredCards(filtered);
  }, [searchQuery, rarityFilter, typeFilter, cards]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const resetFilters = () => {
    setSearchQuery("");
    setRarityFilter("all");
    setTypeFilter("all");
    setIsFiltering(false);
  };

  const addPlaceholderCards = (cardsArray: PokemonCard[]) => {
    if (cardsArray.length === 0 || !cardsPerRow) return cardsArray;
    
    const remainder = cardsArray.length % cardsPerRow;
    if (remainder === 0) return cardsArray;
    
    const placeholdersNeeded = cardsPerRow - remainder;
    
    const placeholders = Array(placeholdersNeeded).fill(null).map((_, idx) => ({
      id: `placeholder-${idx}`,
      isPlaceholder: true
    } as unknown as PokemonCard));
    
    return [...cardsArray, ...placeholders];
  };

  const cardsWithPlaceholders = useMemo(() => {
    return addPlaceholderCards(cardListToDisplay);
  }, [cardListToDisplay, cardsPerRow]);

  const fetchingContent = (
    <div className="p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Progress value={loadProgress} className="h-2 bg-gray-200">
          <div 
            className="h-full bg-red-500 transition-all" 
            style={{ width: `${loadProgress}%` }}
          />
        </Progress>
        <p className="text-gray-500 mt-2 text-center">
          {loadProgress < 100 ? "Fetching cards..." : "Processing cards..."}
        </p>
      </div>
    </div>
  );

  const emptyContent = (
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
  );

  useEffect(() => {
    if (!set) return;
    
    const prefetchRelatedSets = async () => {
      try {
        const allSets = await fetchPokemonSets();
        const relatedSets = allSets
          .filter(s => s.series === set.series && s.set_id !== setId)
          .slice(0, 3);
        
        if (relatedSets.length > 0) {
          console.log(`Prefetching ${relatedSets.length} related sets in the background`);
          
          relatedSets.forEach((relatedSet, index) => {
            setTimeout(() => {
              prefetchPokemonSet(relatedSet.set_id).catch(e => 
                console.warn(`Failed to prefetch related set ${relatedSet.set_id}:`, e)
              );
            }, (index + 1) * 5000);
          });
        }
      } catch (e) {
        console.warn("Failed to prefetch related sets:", e);
      }
    };
    
    setTimeout(prefetchRelatedSets, 10000);
  }, [set, setId]);

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => navigate("/sets/pokemon")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Sets
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {loadingSet ? (
                <div className="h-20 animate-pulse bg-gray-200 rounded-md w-full md:w-48"></div>
              ) : set ? (
                <>
                  {set.logo_url && (
                    <img 
                      src={set.logo_url} 
                      alt={`${set.name} logo`} 
                      className="h-24 object-contain"
                      loading="eager"
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
                      {hasSecretRares && (
                        <span className="text-red-500 font-medium ml-2">
                          + {secretRares.length > 0 ? secretRares.length : "?"} secret rare{secretRares.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p>Set not found</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {!loadingSet && (
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
                {cardListToDisplay.length} of {cards.length} cards shown
                {hasSecretRares && secretRares.length > 0 && (
                  <span className="text-red-500 ml-1">
                    (including {secretRares.length} secret rare{secretRares.length > 1 ? 's' : ''})
                  </span>
                )}
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
        
        <EmptyStateHandler
          isLoading={loadingCards}
          hasItems={cardListToDisplay.length > 0}
          loadingComponent={fetchingContent}
          emptyComponent={emptyContent}
        >
          {isLoadingError ? (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-red-600">Error loading cards</p>
              <p className="text-gray-500 mt-2">There was a problem fetching the card data</p>
              <Button 
                variant="default" 
                className="mt-4"
                onClick={() => {
                  setIsLoadingError(false);
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {cardsWithPlaceholders.map((card, index) => (
                'isPlaceholder' in card ? (
                  <div key={card.id} className="invisible"> </div>
                ) : (
                  <PokemonCardComponent 
                    key={card.id} 
                    card={card} 
                    isSecretRare={
                      hasSecretRares && secretRares.some(sr => sr.id === card.id)
                    }
                    priority={index < 15}
                    index={index}
                    batchAnimation={batchAnimation}
                  />
                )
              ))}
            </div>
          )}
        </EmptyStateHandler>
      </div>
    </Layout>
  );
};

export default PokemonSetDetails;
