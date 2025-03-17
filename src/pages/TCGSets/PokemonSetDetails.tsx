
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
  getCachedSetMetadata
} from "@/utils/pokemon-cards";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [cardsPerRow, setCardsPerRow] = useState(5); // Default value for xl screens
  const [metadataLoaded, setMetadataLoaded] = useState(false); // Track if we've loaded metadata
  
  // Determine which cards to display based on filtering state
  const displayedCards = isFiltering ? filteredCards : cards;
  
  // Calculate grid columns based on screen size
  useEffect(() => {
    const updateCardsPerRow = () => {
      // Determine how many cards per row based on screen width
      if (window.innerWidth >= 1280) { // xl
        setCardsPerRow(5);
      } else if (window.innerWidth >= 1024) { // lg
        setCardsPerRow(4);
      } else if (window.innerWidth >= 768) { // md
        setCardsPerRow(3);
      } else if (window.innerWidth >= 640) { // sm
        setCardsPerRow(2);
      } else {
        setCardsPerRow(1);
      }
    };

    // Set initial value
    updateCardsPerRow();

    // Update on resize
    window.addEventListener('resize', updateCardsPerRow);
    return () => window.removeEventListener('resize', updateCardsPerRow);
  }, []);

  // Load cached metadata first to show stats immediately
  useEffect(() => {
    if (!setId || metadataLoaded) return;
    
    const metadata = getCachedSetMetadata(setId);
    if (metadata) {
      console.log(`Using cached metadata for set ${setId}:`, metadata);
      setHasSecretRares(metadata.hasSecretRares);
      setMetadataLoaded(true);
    }
  }, [setId, metadataLoaded]);

  // 1. First fetch the set details
  useEffect(() => {
    const fetchSetDetails = async () => {
      if (!setId) return;
      
      setLoadingSet(true);
      
      try {
        // Get all sets and find the one matching our ID
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
  
  // 2. Then fetch all cards in the set at once
  useEffect(() => {
    const fetchAllCards = async () => {
      if (!setId) return;
      
      setLoadingCards(true);
      setIsLoadingError(false);
      
      try {
        console.log(`Fetching all cards for set: ${setId}`);
        const result = await fetchPokemonCards(setId, { loadAll: true });
        
        const fetchedCards = result.cards;
        console.log(`Received ${fetchedCards.length} cards for set ${setId}`);
        
        // Preload some card images right after fetching
        preloadCardImages(fetchedCards);
        
        setCards(fetchedCards);
        
        // Check for secret rares
        if (set) {
          const printedTotal = set.printed_total || set.total || 0;
          const secretRaresFound = fetchedCards.filter(card => {
            const cardNumber = parseInt(card.number.match(/^\d+/)?.[0] || '0', 10);
            return cardNumber > printedTotal;
          });
          
          setSecretRares(secretRaresFound);
          setHasSecretRares(secretRaresFound.length > 0);
          
          if (secretRaresFound.length > 0) {
            console.log(`Found ${secretRaresFound.length} secret rares in set ${setId}`);
          }
        }
        
        // Extract unique rarities and types for filters
        const raritiesSet = new Set<string>();
        const typesSet = new Set<string>();
        
        fetchedCards.forEach(card => {
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
  }, [setId, toast, set]);
  
  // Handle filtering of cards separately - memoized for better performance
  const applyFilters = useCallback(() => {
    // If no filter is applied, don't run this effect
    if (rarityFilter === "all" && typeFilter === "all" && !searchQuery) {
      setIsFiltering(false);
      return;
    }
    
    setIsFiltering(true);
    
    // Apply filters to the already loaded cards
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

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const resetFilters = () => {
    setSearchQuery("");
    setRarityFilter("all");
    setTypeFilter("all");
    setIsFiltering(false);
  };

  // Render loading skeletons for cards
  const renderCardSkeletons = () => {
    return Array(cardsPerRow * 2).fill(0).map((_, index) => (
      <div key={`card-skeleton-${index}`} className="flex flex-col space-y-2">
        <Skeleton className="h-64 w-full bg-gray-200" />
        <Skeleton className="h-6 w-3/4 bg-gray-200" />
        <Skeleton className="h-4 w-1/2 bg-gray-200" />
      </div>
    ));
  };

  // Function to add empty placeholder cards to ensure full rows
  const addPlaceholderCards = (cardsArray: PokemonCard[]) => {
    if (cardsArray.length === 0 || !cardsPerRow) return cardsArray;
    
    const remainder = cardsArray.length % cardsPerRow;
    if (remainder === 0) return cardsArray; // Already even rows
    
    // Calculate how many placeholder cards are needed
    const placeholdersNeeded = cardsPerRow - remainder;
    
    // Create array of placeholder cards with unique keys
    const placeholders = Array(placeholdersNeeded).fill(null).map((_, idx) => ({
      id: `placeholder-${idx}`,
      isPlaceholder: true
    } as unknown as PokemonCard));
    
    return [...cardsArray, ...placeholders];
  };

  // Get cards with placeholders if needed
  const cardsWithPlaceholders = useMemo(() => {
    return addPlaceholderCards(displayedCards);
  }, [displayedCards, cardsPerRow]);

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
        
        {/* Filters */}
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
                {displayedCards.length} of {cards.length} cards shown
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
        
        {/* Cards Display */}
        {loadingCards ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {renderCardSkeletons()}
          </div>
        ) : isLoadingError ? (
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
        ) : displayedCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {cardsWithPlaceholders.map((card, index) => (
              // Check if it's a placeholder
              'isPlaceholder' in card ? (
                <div key={card.id} className="invisible"> </div>
              ) : (
                <PokemonCardComponent 
                  key={card.id} 
                  card={card} 
                  isSecretRare={
                    hasSecretRares && secretRares.some(sr => sr.id === card.id)
                  }
                />
              )
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
