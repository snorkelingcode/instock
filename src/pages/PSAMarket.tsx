import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingScreen from "@/components/ui/loading-screen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChartIcon, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MarketStatistics from "@/components/market/MarketStatistics";
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

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

const formatChartCurrency = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
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

const calculateTotalPopulation = (data: MarketDataItem): number => {
  return (
    (data.population_10 || 0) +
    (data.population_9 || 0) +
    (data.population_8 || 0) +
    (data.population_7 || 0) +
    (data.population_6 || 0) +
    (data.population_5 || 0) +
    (data.population_4 || 0) +
    (data.population_3 || 0) +
    (data.population_2 || 0) +
    (data.population_1 || 0) +
    (data.population_auth || 0)
  );
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

const calculateGemRate = (card: MarketDataItem): string => {
  const totalPop = card.total_population || calculateTotalPopulation(card);
  const psa10Count = card.population_10 || 0;
  
  if (totalPop === 0) return "0%";
  
  return ((psa10Count / totalPop) * 100).toFixed(1) + "%";
};

const PSAMarket: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [filteredData, setFilteredData] = useState<MarketDataItem[]>([]);
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
    series: "any",
    set: "any"
  });
  
  const [filterOptions, setFilterOptions] = useState({
    languages: ["any"],
    years: ["any"],
    franchises: ["any"],
    series: ["any"],
    sets: ["any"]
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
  
  const extractYearFromCardName = (cardName: string): string | null => {
    const yearMatch = cardName.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : null;
  };
  
  const generateFilterOptions = (data: MarketDataItem[]) => {
    const languages = ["any"];
    const years = ["any"];
    const franchises = ["any"];
    const seriesOptions = ["any"];
    const sets = ["any"];
    
    data.forEach(card => {
      if (card.language && !languages.includes(card.language)) {
        languages.push(card.language);
      }
      
      const year = card.year || extractYearFromCardName(card.card_name);
      if (year && !years.includes(year)) {
        years.push(year);
      }
      
      if (card.franchise && !franchises.includes(card.franchise)) {
        franchises.push(card.franchise);
      }
      
      if (card.series && !seriesOptions.includes(card.series)) {
        seriesOptions.push(card.series);
      }
      
      if (card.card_set && !sets.includes(card.card_set)) {
        sets.push(card.card_set);
      }
    });
    
    setFilterOptions({
      languages,
      years,
      franchises,
      series: seriesOptions,
      sets
    });
  };
  
  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await marketDataService.getMarketDataByGradingService("PSA");
      console.log("Fetched market data:", data);
      
      if (data.length === 0) {
        console.log("No data found in database, no need to generate mock data as we want real data only");
        setMarketData([]);
        setFilteredData([]);
        setTotalCards(0);
      } else {
        console.log("Using real market data from database");
        const dataWithUpdatedMarketCap = data.map(card => {
          const totalPopulation = card.total_population || calculateTotalPopulation(card);
          const marketCap = card.market_cap || calculateMarketCap(card);
          
          const year = card.year || extractYearFromCardName(card.card_name);
          
          return {
            ...card,
            total_population: totalPopulation,
            market_cap: marketCap,
            year: year
          };
        });
        
        const sortedData = [...dataWithUpdatedMarketCap].sort((a, b) => 
          (b.market_cap || 0) - (a.market_cap || 0)
        );
        
        setMarketData(sortedData);
        setFilteredData(sortedData);
        setTotalCards(sortedData.length);
        
        generateFilterOptions(sortedData);
        
        if (sortedData.length > 0 && !selectedCard) {
          setSelectedCard(sortedData[0]);
          setChartData(generateChartData(sortedData[0]));
          setPriceComparisonData(generatePriceComparisonData(sortedData[0]));
          setPopulationComparisonData(generatePopulationComparisonData(sortedData[0]));
        }
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
      
      setMarketData([]);
      setFilteredData([]);
      setTotalCards(0);
      
      setError(error instanceof Error ? error.message : "Failed to fetch market data");
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

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    
    if (filterType === 'franchise') {
      setFilters(prev => ({ 
        ...prev, 
        [filterType]: value, 
        series: 'any',
        set: 'any' 
      }));
    }
  };
  
  const applyFilters = () => {
    let filtered = [...marketData];
    
    if (filters.language && filters.language !== "any") {
      filtered = filtered.filter(card => 
        card.language === filters.language
      );
    }
    
    if (filters.year && filters.year !== "any") {
      filtered = filtered.filter(card => {
        const cardYear = card.year || extractYearFromCardName(card.card_name);
        return cardYear === filters.year;
      });
    }
    
    if (filters.franchise && filters.franchise !== "any") {
      filtered = filtered.filter(card => 
        card.franchise === filters.franchise
      );
    }
    
    if (filters.series && filters.series !== "any") {
      filtered = filtered.filter(card => 
        card.series === filters.series
      );
    }
    
    if (filters.set && filters.set !== "any") {
      filtered = filtered.filter(card => 
        card.card_set === filters.set
      );
    }
    
    setFilteredData(filtered);
    setTotalCards(filtered.length);
    setCurrentPage(1);
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
        
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg text-blue-700 dark:text-blue-300">Market Data Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-blue-700 dark:text-blue-300 text-sm">
              Welcome to our TCG Market Data section. Here you can find population reports and pricing information for graded trading cards.
              Currently, we're tracking PSA graded cards with detailed population data and estimated market values.
              <span className="block mt-2 font-medium">More cards and grading services will be added as our database grows.</span>
            </CardDescription>
          </CardContent>
        </Card>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && filteredData.length > 0 && (
          <MarketStatistics marketData={filteredData} />
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    {filterOptions.languages.map(language => (
                      <SelectItem key={language} value={language}>
                        {language === "any" ? "Any Language" : language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year-filter">Year</Label>
                <Select 
                  value={filters.year} 
                  onValueChange={(value) => handleFilterChange('year', value)}
                >
                  <SelectTrigger id="year-filter">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.years.map(year => (
                      <SelectItem key={year} value={year}>
                        {year === "any" ? "Any Year" : year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {filterOptions.franchises.map(franchise => (
                      <SelectItem key={franchise} value={franchise}>
                        {franchise === "any" ? "Any Franchise" : franchise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="series-filter">Series</Label>
                <Select 
                  value={filters.series} 
                  onValueChange={(value) => handleFilterChange('series', value)}
                  disabled={filters.franchise === "any"}
                >
                  <SelectTrigger id="series-filter">
                    <SelectValue placeholder="Select Series" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.series
                      .filter(series => series === "any" || 
                        marketData.some(card => 
                          card.series === series && 
                          (filters.franchise === "any" || card.franchise === filters.franchise)
                        )
                      )
                      .map(series => (
                        <SelectItem key={series} value={series}>
                          {series === "any" ? "Any Series" : series}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="set-filter">Set</Label>
                <Select 
                  value={filters.set} 
                  onValueChange={(value) => handleFilterChange('set', value)}
                  disabled={filters.franchise === "any"}
                >
                  <SelectTrigger id="set-filter">
                    <SelectValue placeholder="Select Set" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.sets
                      .filter(set => set === "any" || 
                        marketData.some(card => 
                          card.card_set === set && 
                          (filters.franchise === "any" || card.franchise === filters.franchise) &&
                          (filters.series === "any" || card.series === filters.series)
                        )
                      )
                      .map(set => (
                        <SelectItem key={set} value={set}>
                          {set === "any" ? "Any Set" : set}
                        </SelectItem>
                      ))
                    }
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
                        Market Cap
                      </TableHead>
                      <TableHead className={isMobile ? "hidden sm:table-cell" : ""}>
                        Population
                      </TableHead>
                      <TableHead className={isMobile ? "hidden sm:table-cell" : ""}>
                        Gem Rate
                      </TableHead>
                      <TableHead>
                        {isMobile ? "Market Cap" : "Highest Price"}
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
                        <TableCell className={isMobile ? "hidden sm:table-cell" : ""}>
                          {calculateGemRate(card)}
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
