
import React, { useState, useEffect } from "react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { AreaChart, Area } from "recharts";
import {
  RefreshCcw, ArrowUpDown,
  BarChart as BarChartIcon,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  Info,
  ExternalLink
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import psaService, { PSACard, PSASearchParams } from "@/services/psaService";
import { MarketDataItem, marketDataService } from "@/services/marketDataService";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const GAME_CATEGORIES = {
  POKEMON: "Pokemon",
  MTG: "Magic The Gathering",
  YUGIOH: "Yu-Gi-Oh!",
  LORCANA: "Disney Lorcana",
  ONE_PIECE: "One Piece"
};

// Generate price comparison data for each grade
const generatePriceComparisonData = (card: MarketDataItem | null) => {
  if (!card) return [];
  
  const grades = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'Auth'];
  
  return grades.map(grade => {
    const gradeKey = grade === 'Auth' ? 'auth' : grade;
    const price = card[`price_${gradeKey}` as keyof MarketDataItem] as number || 0;
    
    return {
      grade: grade === 'Auth' ? 'Authentic' : `Grade ${grade}`,
      price: price,
      formattedPrice: formatCurrency(price)
    };
  }).filter(item => item.price > 0);
};

// Generate population comparison data for each grade
const generatePopulationComparisonData = (card: MarketDataItem | null) => {
  if (!card) return [];
  
  const grades = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'Auth'];
  
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

// Format currency helper function
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Format number helper function  
const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat('en-US').format(value);
};

// Generate historical price data (mock data for now)
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

// Helper function to calculate average price
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

const PSAMarket: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(GAME_CATEGORIES.POKEMON);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketDataItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedGradingService, setSelectedGradingService] = useState<string>("PSA");
  const [priceComparisonData, setPriceComparisonData] = useState<any[]>([]);
  const [populationComparisonData, setPopulationComparisonData] = useState<any[]>([]);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  useEffect(() => {
    const savedToken = psaService.getToken();
    if (savedToken) {
      setToken(savedToken);
    }
    
    // Fetch initial market data
    fetchMarketData();
  }, []);
  
  useEffect(() => {
    if (selectedCard) {
      setChartData(generateChartData(selectedCard));
      setPriceComparisonData(generatePriceComparisonData(selectedCard));
      setPopulationComparisonData(generatePopulationComparisonData(selectedCard));
    }
  }, [selectedCard]);
  
  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await marketDataService.getMarketDataByGradingService(selectedGradingService);
      
      if (data.length === 0) {
        setError(`No market data found for ${selectedGradingService} graded cards.`);
        setMarketData([]);
        setSelectedCard(null);
        return;
      }
      
      // Sort by market cap descending
      const sortedData = [...data].sort((a, b) => 
        (b.market_cap || 0) - (a.market_cap || 0)
      );
      
      setMarketData(sortedData);
      
      if (sortedData.length > 0 && !selectedCard) {
        setSelectedCard(sortedData[0]);
        setChartData(generateChartData(sortedData[0]));
        setPriceComparisonData(generatePriceComparisonData(sortedData[0]));
        setPopulationComparisonData(generatePopulationComparisonData(sortedData[0]));
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch market data");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch market data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTokenSave = () => {
    if (token) {
      psaService.setToken(token);
      toast({
        title: "Success",
        description: "PSA API token has been saved",
      });
    }
  };
  
  const handleRefresh = () => {
    fetchMarketData();
  };
  
  const handleCardSelect = (card: MarketDataItem) => {
    setSelectedCard(card);
  };
  
  const handleGradingServiceChange = (value: string) => {
    setSelectedGradingService(value);
    setSelectedCard(null);
    fetchMarketData();
  };
  
  // Calculate total market cap for selected cards
  const calculateTotalMarketCap = () => {
    return marketData.reduce((sum, card) => sum + (card.market_cap || 0), 0);
  };
  
  // Calculate total population for selected cards
  const calculateTotalPopulation = () => {
    return marketData.reduce((sum, card) => sum + (card.total_population || 0), 0);
  };
  
  // Calculate average price for selected cards
  const calculateOverallAveragePrice = () => {
    const totalValue = marketData.reduce((sum, card) => {
      const avgPrice = calculateAveragePrice(card) || 0;
      return sum + avgPrice;
    }, 0);
    
    return marketData.length > 0 ? totalValue / marketData.length : 0;
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-3xl font-bold mb-6">TCG Market Data</h1>
          {isAdmin && (
            <Link to="/admin/manage-market">
              <Button variant="outline" className="mb-6">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Market Data
              </Button>
            </Link>
          )}
        </div>
        
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">TCG Market Analytics</AlertTitle>
          <AlertDescription className="text-blue-700">
            View and analyze market data for trading card games. This data is sourced from our database and provides insights into card populations and pricing trends.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Select Grading Service</CardTitle>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="grading-service">Grading Service</Label>
                <Select value={selectedGradingService} onValueChange={handleGradingServiceChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a grading service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PSA">PSA</SelectItem>
                    <SelectItem value="BGS">BGS</SelectItem>
                    <SelectItem value="CGC">CGC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? 
                  <Skeleton className="h-8 w-32" /> :
                  formatCurrency(calculateTotalMarketCap())
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCard ? 'Individual Card' : 'All Cards'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <BarChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? 
                  <Skeleton className="h-8 w-32" /> :
                  selectedCard ?
                    formatCurrency(calculateAveragePrice(selectedCard)) :
                    formatCurrency(calculateOverallAveragePrice())
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCard ? 'Individual Card' : 'All Cards'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? 
                  <Skeleton className="h-8 w-32" /> :
                  formatNumber(marketData.length)
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Unique cards tracked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Population</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? 
                  <Skeleton className="h-8 w-32" /> :
                  selectedCard ?
                    formatNumber(selectedCard.total_population) :
                    formatNumber(calculateTotalPopulation())
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCard ? 'Individual Card' : 'All Cards'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Market Data</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <LoadingScreen message="Fetching market data..." />
              </div>
            ) : marketData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Card Name</TableHead>
                      <TableHead>Grading Service</TableHead>
                      <TableHead>Population</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Avg Price
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Market Cap
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketData.map((card) => (
                      <TableRow 
                        key={card.id}
                        className={`cursor-pointer hover:bg-muted ${selectedCard?.id === card.id ? 'bg-muted' : ''}`}
                        onClick={() => handleCardSelect(card)}
                      >
                        <TableCell className="font-medium">{card.card_name}</TableCell>
                        <TableCell>{card.grading_service}</TableCell>
                        <TableCell>{formatNumber(card.total_population)}</TableCell>
                        <TableCell>{formatCurrency(calculateAveragePrice(card))}</TableCell>
                        <TableCell>{formatCurrency(card.market_cap)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No market data found</h3>
                <p className="text-sm text-muted-foreground">
                  No market data available for the selected grading service.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {selectedCard && (
          <Card>
            <CardHeader>
              <CardTitle>Card Details: {selectedCard.card_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedCard.card_image && (
                    <div className="flex justify-center mb-4">
                      <img 
                        src={selectedCard.card_image} 
                        alt={selectedCard.card_name} 
                        className="rounded-lg shadow-md max-h-80 object-contain"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Card Name</h4>
                      <p className="text-md">{selectedCard.card_name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Grading Service</h4>
                      <p className="text-md">{selectedCard.grading_service}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Total Population</h4>
                      <p className="text-md">{formatNumber(selectedCard.total_population)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Market Cap</h4>
                      <p className="text-md">{formatCurrency(selectedCard.market_cap)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold mb-2">Population Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(grade => (
                        <div key={`pop-${grade}`}>
                          <h4 className="text-sm font-medium text-muted-foreground">Grade {grade}</h4>
                          <p className="text-md">
                            {formatNumber(selectedCard[`population_${grade}` as keyof MarketDataItem] as number)}
                          </p>
                        </div>
                      ))}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Authentic</h4>
                        <p className="text-md">{formatNumber(selectedCard.population_auth)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Tabs defaultValue="price">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="price">Price Analysis</TabsTrigger>
                      <TabsTrigger value="population">Population Analysis</TabsTrigger>
                    </TabsList>
                    <TabsContent value="price">
                      <div className="h-[350px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={priceComparisonData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 70,
                            }}
                            barSize={30}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="grade" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80}
                              interval={0}
                            />
                            <YAxis />
                            <RechartsTooltip 
                              formatter={(value: any) => [`${formatCurrency(value)}`, 'Price']} 
                              labelFormatter={(label) => `${label}`}
                            />
                            <Legend />
                            <Bar 
                              dataKey="price" 
                              name="Price" 
                              fill="#82ca9d" 
                              label={{
                                position: 'top',
                                formatter: (value: any) => formatCurrency(value),
                                fontSize: 11,
                                fill: '#666',
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Price Highlights</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold">Highest Grade Price</p>
                            <p className="text-md">
                              {selectedCard.price_10 ? formatCurrency(selectedCard.price_10) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Price Difference (10 to 9)</p>
                            {selectedCard.price_10 && selectedCard.price_9 ? (
                              <p className="text-md">
                                {formatCurrency(selectedCard.price_10 - selectedCard.price_9)} 
                                ({Math.round(((selectedCard.price_10 / selectedCard.price_9) - 1) * 100)}%)
                              </p>
                            ) : (
                              <p className="text-md">N/A</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="population">
                      <div className="h-[350px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={populationComparisonData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 70,
                            }}
                            barSize={30}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="grade" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80}
                              interval={0}
                            />
                            <YAxis />
                            <RechartsTooltip 
                              formatter={(value: any) => [`${formatNumber(value)}`, 'Population']} 
                              labelFormatter={(label) => `${label}`}
                            />
                            <Legend />
                            <Bar 
                              dataKey="population" 
                              name="Population" 
                              fill="#8884d8" 
                              label={{
                                position: 'top',
                                formatter: (value: any) => formatNumber(value),
                                fontSize: 11,
                                fill: '#666',
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Population Highlights</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold">Highest Population Grade</p>
                            {(() => {
                              const grades = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                              const highestGrade = grades.reduce((prev, current) => {
                                const prevValue = selectedCard[`population_${prev}` as keyof MarketDataItem] as number || 0;
                                const currentValue = selectedCard[`population_${current}` as keyof MarketDataItem] as number || 0;
                                return currentValue > prevValue ? current : prev;
                              }, 10);
                              
                              return (
                                <p className="text-md">
                                  Grade {highestGrade} ({formatNumber(selectedCard[`population_${highestGrade}` as keyof MarketDataItem] as number)})
                                </p>
                              );
                            })()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Population Ratio (Gem Mint/Total)</p>
                            <p className="text-md">
                              {(((selectedCard.population_10 || 0) / (selectedCard.total_population || 1)) * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PSAMarket;
