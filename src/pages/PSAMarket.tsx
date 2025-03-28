import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingScreen from "@/components/ui/loading-screen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, BarChartIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import psaService, { PSACard, PSASearchParams } from "@/services/psaService";
import { MarketDataItem, marketDataService } from "@/services/marketDataService";
import { useIsMobile } from "@/hooks/use-mobile";
import { Grid } from "@/components/ui/grid";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const GAME_CATEGORIES = {
  POKEMON: "Pokemon",
  MTG: "Magic The Gathering",
  YUGIOH: "Yu-Gi-Oh!",
  LORCANA: "Disney Lorcana",
  ONE_PIECE: "One Piece"
};

const LANGUAGE_OPTIONS = ["English", "Japanese"];
const COMING_SOON_LANGUAGES = ["Chinese", "Korean"];
const YEAR_OPTIONS = Array.from({ length: 25 }, (_, i) => (2023 - i).toString());
const FRANCHISE_OPTIONS = Object.values(GAME_CATEGORIES);
const SET_OPTIONS = {
  "Pokemon": ["Scarlet & Violet", "Sword & Shield", "Sun & Moon", "XY", "Black & White", "HeartGold & SoulSilver", "Platinum", "Diamond & Pearl"],
  "Magic The Gathering": ["The Lost Caverns of Ixalan", "Wilds of Eldraine", "March of the Machine", "Phyrexia: All Will Be One", "The Brothers' War"],
  "Yu-Gi-Oh!": ["Phantom Rage", "Eternity Code", "Ignition Assault", "Chaos Impact", "Rising Rampage"],
  "Disney Lorcana": ["Rise of the Floodborn", "The First Chapter", "Into the Inklands"],
  "One Piece": ["Romance Dawn", "Paramount War", "Pillars of Strength", "Kingdoms of Intrigue"]
};

const generatePriceComparisonData = (card: MarketDataItem | null) => {
  if (!card) return [];
  
  const grades = ['Auth', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  return grades.map(grade => {
    const gradeKey = grade === 'Auth' ? 'auth' : grade;
    const price = card[`price_${gradeKey}` as keyof MarketDataItem] as number || 0;
    
    return {
      grade: grade === 'Auth' ? 'Authentic' : `Grade ${grade}`,
      price: price,
      formattedPrice: price.toLocaleString()
    };
  }).filter(item => item.price > 0);
};

const generatePopulationComparisonData = (card: MarketDataItem | null) => {
  if (!card) return [];
  
  const grades = ['Auth', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  return grades.map(grade => {
    const gradeKey = grade === 'Auth' ? 'auth' : grade;
    const population = card[`population_${gradeKey}` as keyof MarketDataItem] as number || 0;
    
    return {
      grade: grade === 'Auth' ? 'Authentic' : `Grade ${grade}`,
      population: population,
      formattedPopulation: formatNumber(population)
    };
  }).filter(item => item.population > 0);
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  if (value < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatChartCurrency = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  if (value >= 100000) {
    return `$${Math.round(value / 1000)}K`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${Math.round(value)}`;
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat('en-US').format(value);
};

const formatChartNumber = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  if (value >= 100000) {
    return `${Math.round(value / 1000)}K`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

const generateChartData = (card: MarketDataItem | null) => {
  if (!card) return [];
  
  const basePrice = calculateAveragePrice(card) || 1000;
  const baseVolume = card.total_population || 100;
  
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2023, i, 1).toLocaleString('default', { month: 'short' });
    const variance = Math.random() * 0.4 - 0.2;
    const price = Math.floor(basePrice * (1 + variance));
    const volumeVariance = Math.random() * 0.6 - 0.3;
    const volume = Math.floor(baseVolume * (1 + volumeVariance));
    
    return {
      name: month,
      value: price,
      volume: volume
    };
  });
};

const calculateAveragePrice = (data: MarketDataItem): number | null => {
  let totalPrice = 0;
  let priceCount = 0;
  
  if (data.price_10) { totalPrice += data.price_10; priceCount++; }
  if (data.price_9) { totalPrice += data.price_9; priceCount++; }
  if (data.price_8) { totalPrice += data.price_8; priceCount++; }
  if (data.price_7) { totalPrice += data.price_7; priceCount++; }
  if (data.price_6) { totalPrice += data.price_6; priceCount++; }
  if (data.price_5) { totalPrice += data.price_5; priceCount++; }
  if (data.price_4) { totalPrice += data.price_4; priceCount++; }
  if (data.price_3) { totalPrice += data.price_3; priceCount++; }
  if (data.price_2) { totalPrice += data.price_2; priceCount++; }
  if (data.price_1) { totalPrice += data.price_1; priceCount++; }
  if (data.price_auth) { totalPrice += data.price_auth; priceCount++; }
  
  return priceCount > 0 ? totalPrice / priceCount : null;
};

const getHighestPrice = (data: MarketDataItem): number | null => {
  const priceList = [
    data.price_10,
    data.price_9,
    data.price_8,
    data.price_7,
    data.price_6,
    data.price_5,
    data.price_4,
    data.price_3,
    data.price_2,
    data.price_1,
    data.price_auth
  ].filter(price => price !== null && price !== undefined) as number[];
  
  return priceList.length > 0 ? Math.max(...priceList) : null;
};

const calculateMarketCap = (data: MarketDataItem): number => {
  if (data.market_cap) return data.market_cap;
  
  let totalValue = 0;
  
  if (data.population_10 && data.price_10) totalValue += data.population_10 * data.price_10;
  if (data.population_9 && data.price_9) totalValue += data.population_9 * data.price_9;
  if (data.population_8 && data.price_8) totalValue += data.population_8 * data.price_8;
  if (data.population_7 && data.price_7) totalValue += data.population_7 * data.price_7;
  if (data.population_6 && data.price_6) totalValue += data.population_6 * data.price_6;
  if (data.population_5 && data.price_5) totalValue += data.population_5 * data.price_5;
  if (data.population_4 && data.price_4) totalValue += data.population_4 * data.price_4;
  if (data.population_3 && data.price_3) totalValue += data.population_3 * data.price_3;
  if (data.population_2 && data.price_2) totalValue += data.population_2 * data.price_2;
  if (data.population_1 && data.price_1) totalValue += data.population_1 * data.price_1;
  if (data.population_auth && data.price_auth) totalValue += data.population_auth * data.price_auth;
  
  return totalValue;
};

const generateMockMarketData = (count: number): MarketDataItem[] => {
  const placeholderImages = [
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    "https://images.unsplash.com/photo-1518770660439-4636190af475",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    "https://images.unsplash.com/photo-1649972904349-6e44c42644a7"
  ];
  
  const years = YEAR_OPTIONS.slice(0, 10);
  const sets = SET_OPTIONS["Pokemon"];
  
  return Array.from({ length: count }, (_, i) => {
    const pokemonNames = [
      "Charizard", "Pikachu", "Blastoise", "Venusaur", "Mewtwo", 
      "Mew", "Lugia", "Ho-Oh", "Rayquaza", "Umbreon"
    ];
    
    const randomYear = years[Math.floor(Math.random() * years.length)];
    const randomSet = sets[Math.floor(Math.random() * sets.length)];
    
    const cardName = `${pokemonNames[i % pokemonNames.length]} ${randomSet} ${randomYear} ${["Holo", "Vmax", "GX", "EX", "Full Art"][Math.floor(Math.random() * 5)]}`;
    
    const population10 = Math.floor(Math.random() * 500) + 10;
    const population9 = Math.floor(Math.random() * 1000) + 100;
    const price10 = Math.floor(Math.random() * 10000) + 1000;
    const price9 = Math.floor(Math.random() * 5000) + 500;
    
    const totalPopulation = population10 + population9 + 
      Math.floor(Math.random() * 3000) + 500;
    
    const marketCap = (population10 * price10) + (population9 * price9) + 
      Math.floor(Math.random() * 5000000);
      
    return {
      id: `mock-${i}`,
      card_name: cardName,
      grading_service: "PSA",
      population_10: population10,
      population_9: population9,
      price_10: price10,
      price_9: price9,
      total_population: totalPopulation,
      market_cap: marketCap,
      card_image: placeholderImages[i % placeholderImages.length]
    };
  });
};

const PSAMarket: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [filteredData, setFilteredData] = useState<MarketDataItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(GAME_CATEGORIES.POKEMON);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketDataItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceComparisonData, setPriceComparisonData] = useState<any[]>([]);
  const [populationComparisonData, setPopulationComparisonData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCards, setTotalCards] = useState<number>(0);
  const [yearInput, setYearInput] = useState<string>("");
  const [filters, setFilters] = useState({
    language: "any",
    year: "any",
    franchise: "any",
    set: "any"
  });
  const cardsPerPage = 15;
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  useEffect(() => {
    const savedToken = psaService.getToken();
    if (savedToken) {
      setToken(savedToken);
    }
    
    fetchMarketData();
  }, []);
  
  useEffect(() => {
    if (selectedCard) {
      setChartData(generateChartData(selectedCard));
      setPriceComparisonData(generatePriceComparisonData(selectedCard));
      setPopulationComparisonData(generatePopulationComparisonData(selectedCard));
    }
  }, [selectedCard]);

  useEffect(() => {
    applyFilters();
  }, [marketData, filters]);
  
  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await marketDataService.getMarketDataByGradingService("PSA");
      console.log("Fetched market data:", data);
      
      if (data.length === 0) {
        console.log("No data found in database, generating mock data");
        const mockData = generateMockMarketData(30);
        console.log("Generated mock market data:", mockData);
        setMarketData(mockData);
        setFilteredData(mockData);
        setTotalCards(mockData.length);
        
        if (mockData.length > 0) {
          setSelectedCard(mockData[0]);
          setChartData(generateChartData(mockData[0]));
          setPriceComparisonData(generatePriceComparisonData(mockData[0]));
          setPopulationComparisonData(generatePopulationComparisonData(mockData[0]));
        }
      } else {
        console.log("Using real market data from database");
        const dataWithUpdatedMarketCap = data.map(card => {
          // Ensure total_population and market_cap are set if not already
          const totalPopulation = card.total_population || calculateTotalPopulation(card);
          const marketCap = card.market_cap || calculateMarketCap(card);

          return {
            ...card,
            total_population: totalPopulation,
            market_cap: marketCap
          };
        });
        
        const sortedData = [...dataWithUpdatedMarketCap].sort((a, b) => 
          (b.market_cap || 0) - (a.market_cap || 0)
        );
        
        setMarketData(sortedData);
        setFilteredData(sortedData);
        setTotalCards(sortedData.length);
        
        if (sortedData.length > 0 && !selectedCard) {
          setSelectedCard(sortedData[0]);
          setChartData(generateChartData(sortedData[0]));
          setPriceComparisonData(generatePriceComparisonData(sortedData[0]));
          setPopulationComparisonData(generatePopulationComparisonData(sortedData[0]));
        }
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
      
      const mockData = generateMockMarketData(30);
      console.log("Generated fallback mock market data due to error:", mockData);
      setMarketData(mockData);
      setFilteredData(mockData);
      setTotalCards(mockData.length);
      
      if (mockData.length > 0) {
        setSelectedCard(mockData[0]);
        setChartData(generateChartData(mockData[0]));
        setPriceComparisonData(generatePriceComparisonData(mockData[0]));
        setPopulationComparisonData(generatePopulationComparisonData(mockData[0]));
      }
      
      setError(error instanceof Error ? error.message : "Failed to fetch market data, showing sample data instead");
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateTotalPopulation = (card: MarketDataItem): number => {
    return (
      (card.population_10 || 0) +
      (card.population_9 || 0) +
      (card.population_8 || 0) +
      (card.population_7 || 0) +
      (card.population_6 || 0) +
      (card.population_5 || 0) +
      (card.population_4 || 0) +
      (card.population_3 || 0) +
      (card.population_2 || 0) +
      (card.population_1 || 0) +
      (card.population_auth || 0)
    );
  };
  
  const applyFilters = () => {
    let filtered = [...marketData];
    
    if (filters.language && filters.language !== "any") {
      filtered = filtered.filter(card => {
        return card.card_name?.includes(filters.language) || false;
      });
    }
    
    if (filters.year && filters.year !== "any") {
      filtered = filtered.filter(card => {
        const cardYear = card.card_name?.includes(filters.year) || false;
        return cardYear;
      });
    }
    
    if (filters.franchise && filters.franchise !== "any") {
      filtered = filtered.filter(card => {
        return card.card_name?.includes(filters.franchise.split(" ")[0]) || false;
      });
    }
    
    if (filters.set && filters.set !== "any") {
      filtered = filtered.filter(card => {
        const cardSet = card.card_name?.includes(filters.set) || false;
        return cardSet;
      });
    }
    
    setFilteredData(filtered);
    setTotalCards(filtered.length);
    setCurrentPage(1);
  };
  
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    
    if (filterType === 'franchise') {
      setFilters(prev => ({ ...prev, [filterType]: value, set: 'any' }));
    }
  };
  
  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setYearInput(value);
    handleFilterChange('year', value || 'any');
  };
  
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredData.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(filteredData.length / cardsPerPage);
  
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  
  const handleTokenSave = () => {
    if (token) {
      psaService.setToken(token);
      toast({
        title: "Success",
        description: "PSA API token has been saved",
      });
    }
  };
  
  const handleCardSelect = (card: MarketDataItem) => {
    setSelectedCard(card);
  };
  
  const handleViewCardDetails = (card: MarketDataItem) => {
    navigate(`/psa-market/${card.id}`, { state: { card } });
  };
  
  const calculateTotalMarketCap = () => {
    return filteredData.reduce((sum, card) => sum + (card.market_cap || 0), 0);
  };
  
  const calculateTotalPopulationAll = () => {
    return filteredData.reduce((sum, card) => sum + (card.total_population || 0), 0);
  };
  
  const calculateOverallAveragePrice = () => {
    const totalValue = filteredData.reduce((sum, card) => {
      const avgPrice = calculateAveragePrice(card) || 0;
      return sum + avgPrice;
    }, 0);
    
    return filteredData.length > 0 ? totalValue / filteredData.length : 0;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-3xl font-bold mb-6">TCG Market Data</h1>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language-filter">Language</Label>
                <Select 
                  value={filters.language} 
                  onValueChange={(value) => handleFilterChange('language', value)}
                >
                  <SelectTrigger id="language-filter">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Language</SelectItem>
                    {LANGUAGE_OPTIONS.filter(lang => lang && lang.trim() !== "").map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                    {COMING_SOON_LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={`${lang}-disabled`} disabled>
                        {lang} (Coming Soon)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year-filter">Year</Label>
                <Input
                  id="year-filter"
                  type="text"
                  placeholder="Enter year..."
                  value={yearInput}
                  onChange={handleYearInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="franchise-filter">Franchise</Label>
                <Select 
                  value={filters.franchise} 
                  onValueChange={(value) => handleFilterChange('franchise', value)}
                >
                  <SelectTrigger id="franchise-filter">
                    <SelectValue placeholder="Select Franchise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Franchise</SelectItem>
                    <SelectItem value={GAME_CATEGORIES.POKEMON}>{GAME_CATEGORIES.POKEMON}</SelectItem>
                    {Object.values(GAME_CATEGORIES)
                      .filter(franchise => franchise !== GAME_CATEGORIES.POKEMON)
                      .map(franchise => (
                        <SelectItem key={franchise} value={`${franchise}-disabled`} disabled>
                          {franchise} (Coming Soon)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="set-filter">Set</Label>
                <Select 
                  value={filters.set} 
                  onValueChange={(value) => handleFilterChange('set', value)}
                  disabled={!filters.franchise || filters.franchise === "any" || filters.franchise !== GAME_CATEGORIES.POKEMON}
                >
                  <SelectTrigger id="set-filter">
                    <SelectValue placeholder="Select Set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Set</SelectItem>
                    {filters.franchise === GAME_CATEGORIES.POKEMON && 
                      SET_OPTIONS[GAME_CATEGORIES.POKEMON]?.filter(set => set && set.trim() !== "").map(set => (
                        <SelectItem key={set} value={set}>{set}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Market Data</CardTitle>
            <div className="text-sm text-muted-foreground">
              Tracking {totalCards} cards
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <LoadingScreen message="Fetching market data..." />
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>Card Name</TableHead>
                      <TableHead className={isMobile ? "hidden sm:table-cell" : ""}>
                        <div className="flex items-center">
                          Market Cap
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className={isMobile ? "hidden sm:table-cell" : ""}>
                        Population
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          {isMobile ? "Market Cap" : "Highest Price"}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCards.map((card, index) => (
                      <TableRow 
                        key={card.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleViewCardDetails(card)}
                      >
                        <TableCell className="font-medium text-center">{indexOfFirstCard + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {card.card_image && (
                              <img 
                                src={card.card_image} 
                                alt={card.card_name} 
                                className="w-8 h-8 rounded-sm object-contain" 
                              />
                            )}
                            {!card.card_image && (
                              <div className="w-8 h-8 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400">
                                <BarChartIcon className="w-4 h-4" />
                              </div>
                            )}
                            <span className="line-clamp-2">
                              {card.card_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={`font-semibold ${isMobile ? "hidden sm:table-cell" : ""}`}>
                          {formatCurrency(card.market_cap)}
                        </TableCell>
                        <TableCell className={isMobile ? "hidden sm:table-cell" : ""}>
                          {formatNumber(card.total_population)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {isMobile 
                            ? formatCurrency(card.market_cap) 
                            : formatCurrency(getHighestPrice(card))
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="py-4 px-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={prevPage} 
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                          <PaginationItem key={number}>
                            <PaginationLink 
                              onClick={() => paginate(number)}
                              isActive={currentPage === number}
                            >
                              {number}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={nextPage} 
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No market data found</h3>
                <p className="text-sm text-muted-foreground">
                  No market data available for PSA graded cards.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PSAMarket;
