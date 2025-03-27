import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingScreen from "@/components/ui/loading-screen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowUpDown, BarChartIcon, DollarSign, Package, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MarketDataItem, marketDataService } from "@/services/marketDataService";

const GAME_CATEGORIES = {
  POKEMON: "Pokemon",
  MTG: "Magic The Gathering",
  YUGIOH: "Yu-Gi-Oh!",
  LORCANA: "Disney Lorcana",
  ONE_PIECE: "One Piece"
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

const PSAMarket: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(GAME_CATEGORIES.POKEMON);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketDataItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceComparisonData, setPriceComparisonData] = useState<any[]>([]);
  const [populationComparisonData, setPopulationComparisonData] = useState<any[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
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
      
      console.log("Fetching market data for PSA");
      const data = await marketDataService.getMarketDataByGradingService("PSA");
      console.log("Fetched market data:", data);
      
      if (data.length === 0) {
        console.log("No market data found");
        // Creating mock data if no real data exists
        const mockData = createMockMarketData();
        setMarketData(mockData);
        setSelectedCard(mockData[0]);
        setChartData(generateChartData(mockData[0]));
        setPriceComparisonData(generatePriceComparisonData(mockData[0]));
        setPopulationComparisonData(generatePopulationComparisonData(mockData[0]));
        return;
      }
      
      const dataWithUpdatedMarketCap = data.map(card => ({
        ...card,
        market_cap: calculateMarketCap(card)
      }));
      
      const sortedData = [...dataWithUpdatedMarketCap].sort((a, b) => 
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
      // If there's an error, create mock data
      const mockData = createMockMarketData();
      setMarketData(mockData);
      setSelectedCard(mockData[0]);
      setChartData(generateChartData(mockData[0]));
      setPriceComparisonData(generatePriceComparisonData(mockData[0]));
      setPopulationComparisonData(generatePopulationComparisonData(mockData[0]));
    } finally {
      setIsLoading(false);
    }
  };
  
  const createMockMarketData = (): MarketDataItem[] => {
    // Creating sample mock data for display when real data is not available
    const mockCards: MarketDataItem[] = [
      {
        id: "1",
        card_name: "Charizard 1st Edition Base Set",
        grading_service: "PSA",
        price_10: 350000,
        price_9: 20000,
        price_8: 5000,
        price_7: 1500,
        population_10: 120,
        population_9: 670,
        population_8: 1240,
        population_7: 980,
        total_population: 3010,
        market_cap: 42000000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        card_name: "Blastoise 1st Edition Base Set",
        grading_service: "PSA",
        price_10: 15000,
        price_9: 5000,
        price_8: 2000,
        population_10: 40,
        population_9: 350,
        population_8: 870,
        total_population: 1260,
        market_cap: 2400000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        card_name: "Venusaur 1st Edition Base Set",
        grading_service: "PSA",
        price_10: 12000,
        price_9: 4500,
        price_8: 1800,
        population_10: 35,
        population_9: 320,
        population_8: 790,
        total_population: 1145,
        market_cap: 2000000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    
    return mockCards;
  };
  
  const handleCardSelect = (card: MarketDataItem) => {
    setSelectedCard(card);
  };
  
  const calculateTotalMarketCap = () => {
    return marketData.reduce((sum, card) => sum + (card.market_cap || 0), 0);
  };
  
  const calculateTotalPopulation = () => {
    return marketData.reduce((sum, card) => sum + (card.total_population || 0), 0);
  };
  
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
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>Card Name</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Market Cap
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Population</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Highest Price
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketData.map((card, index) => (
                      <TableRow 
                        key={card.id}
                        className={`cursor-pointer hover:bg-muted ${selectedCard?.id === card.id ? 'bg-muted' : ''}`}
                        onClick={() => handleCardSelect(card)}
                      >
                        <TableCell className="font-medium text-center">{index + 1}</TableCell>
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
                            {card.card_name}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(card.market_cap)}</TableCell>
                        <TableCell>{formatNumber(card.total_population)}</TableCell>
                        <TableCell>{formatCurrency(getHighestPrice(card))}</TableCell>
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
                  No market data available for PSA graded cards.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {selectedCard && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedCard.card_name}</CardTitle>
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
                            <YAxis 
                              tickFormatter={(value) => formatChartCurrency(value)}
                            />
                            <RechartsTooltip 
                              formatter={(value: any) => [`${formatCurrency(value)}`, 'Price']} 
                              labelFormatter={(label) => `${label}`}
                            />
                            <Legend />
                            <Bar 
                              dataKey="price" 
                              name="Price" 
                              fill="#ea384c" 
                              label={{
                                position: 'top',
                                formatter: (value: any) => {
                                  if (value >= 100000) {
                                    return `${Math.round(value / 1000)}K`;
                                  } else if (value >= 1000) {
                                    return `${(value / 1000).toFixed(2)}K`;
                                  }
                                  return value.toLocaleString();
                                },
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
                            <YAxis 
                              tickFormatter={(value) => formatChartNumber(value)}
                            />
                            <RechartsTooltip 
                              formatter={(value: any) => [`${formatNumber(value)}`, 'Population']} 
                              labelFormatter={(label) => `${label}`}
                            />
                            <Legend />
                            <Bar 
                              dataKey="population" 
                              name="Population" 
                              fill="#ea384c" 
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
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedCard.market_cap)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Individual Card
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
                    <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(getHighestPrice(selectedCard))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Individual Card
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
                      {formatNumber(marketData.length)}
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
                      {formatNumber(selectedCard.total_population)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Individual Card
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PSAMarket;
