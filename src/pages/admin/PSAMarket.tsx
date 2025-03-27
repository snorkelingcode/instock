
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AreaChart, Area } from "recharts";
import {
  Search, RefreshCcw, ArrowUpDown,
  BarChart as BarChartIcon,
  DollarSign,
  Package,
  TrendingUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import psaService, { PSACard, PSASearchParams } from "@/services/psaService";

// Mock data for charts
const generateMockChartData = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    name: new Date(2023, i, 1).toLocaleString('default', { month: 'short' }),
    value: Math.floor(Math.random() * 10000),
    volume: Math.floor(Math.random() * 500)
  }));
};

// Game category options
const GAME_CATEGORIES = {
  POKEMON: "Pokemon",
  MTG: "Magic The Gathering",
  YUGIOH: "Yu-Gi-Oh!",
  LORCANA: "Disney Lorcana",
  ONE_PIECE: "One Piece"
};

const PSAMarket: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cards, setCards] = useState<PSACard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(GAME_CATEGORIES.POKEMON);
  const [chartData] = useState(generateMockChartData());
  const [selectedCard, setSelectedCard] = useState<PSACard | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Load token from localStorage
    const savedToken = psaService.getToken();
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);
  
  useEffect(() => {
    // When category changes, fetch data if token exists
    if (token && selectedCategory) {
      fetchCardsByCategory(selectedCategory);
    }
  }, [selectedCategory, token]);
  
  const fetchCardsByCategory = async (category: string) => {
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please set your PSA API token first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare search parameters
      const searchParams: PSASearchParams = {
        sport: category,
        page: 1,
        pageSize: 20
      };
      
      // In a real app, we would fetch real data like this:
      // const result = await psaService.searchCards(searchParams);
      // However, since we don't want to use the actual API limit, we'll use sample data:
      
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate sample data
      const mockCards: PSACard[] = Array.from({ length: 15 }, (_, i) => ({
        certNumber: `${10000000 + i}`,
        certDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        grade: String(Math.floor(Math.random() * 3) + 8), // 8, 9, or 10
        description: `${category} ${["Rare", "Holographic", "First Edition", "Limited"][Math.floor(Math.random() * 4)]} Card #${i + 1}`,
        cardInfo: {
          brand: ["Topps", "Panini", "Upper Deck", "Wizards of the Coast"][Math.floor(Math.random() * 4)],
          year: String(2000 + Math.floor(Math.random() * 23)),
          sport: category,
          cardNumber: String(i + 1),
          playerName: `${category} Character ${i + 1}`
        },
        popReport: {
          totalPop: Math.floor(Math.random() * 5000) + 100,
          popHigher: Math.floor(Math.random() * 100),
          popSame: Math.floor(Math.random() * 1000),
          popLower: Math.floor(Math.random() * 3000)
        }
      }));
      
      // Enrich with market data
      const enrichedCards = psaService.enrichWithMarketData(mockCards);
      
      // Sort by market cap (highest to lowest)
      const sortedCards = enrichedCards.sort((a, b) => 
        (b.marketData?.marketCap || 0) - (a.marketData?.marketCap || 0)
      );
      
      setCards(sortedCards);
      
      // Select the first card by default
      if (sortedCards.length > 0) {
        setSelectedCard(sortedCards[0]);
      }
      
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "Failed to search cards",
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
      
      // Fetch data for the selected category immediately after saving token
      if (selectedCategory) {
        fetchCardsByCategory(selectedCategory);
      }
    }
  };
  
  const formatCurrency = (value?: number) => {
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  const formatNumber = (value?: number) => {
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  const handleCardSelect = (card: PSACard) => {
    setSelectedCard(card);
  };
  
  const handleCategoryChange = (value: string) => {
    setSelectedCard(null);
    setSelectedCategory(value);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6">PSA Market</h1>
        
        {/* API Token Setup */}
        <Card>
          <CardHeader>
            <CardTitle>PSA API Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="psa-token">PSA API Token</Label>
                <Input
                  id="psa-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your PSA API token"
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleTokenSave}>Save Token</Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Limited to 100 API calls per day. This token is stored locally and is not shared.
            </p>
          </CardContent>
        </Card>
        
        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Trading Card Game Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="category">Game Category</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GAME_CATEGORIES.POKEMON}>{GAME_CATEGORIES.POKEMON}</SelectItem>
                    <SelectItem value={GAME_CATEGORIES.MTG}>{GAME_CATEGORIES.MTG}</SelectItem>
                    <SelectItem value={GAME_CATEGORIES.YUGIOH}>{GAME_CATEGORIES.YUGIOH}</SelectItem>
                    <SelectItem value={GAME_CATEGORIES.LORCANA}>{GAME_CATEGORIES.LORCANA}</SelectItem>
                    <SelectItem value={GAME_CATEGORIES.ONE_PIECE}>{GAME_CATEGORIES.ONE_PIECE}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedCard ? 
                  formatCurrency(selectedCard.marketData?.marketCap) :
                  cards.length > 0 ? 
                    formatCurrency(cards.reduce((sum, card) => sum + (card.marketData?.marketCap || 0), 0)) :
                    "$0.00"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedCard ?
                  formatNumber(selectedCard.marketData?.volume) :
                  cards.length > 0 ? 
                    formatNumber(cards.reduce((sum, card) => sum + (card.marketData?.volume || 0), 0)) :
                    "0"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Card Price</CardTitle>
              <BarChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedCard ?
                  formatCurrency(selectedCard.marketData?.averagePrice) :
                  cards.length > 0 ? 
                    formatCurrency(cards.reduce((sum, card) => sum + (card.marketData?.averagePrice || 0), 0) / cards.length) :
                    "$0.00"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                -3.2% from last month
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
                {selectedCard ?
                  formatNumber(selectedCard.popReport?.totalPop) :
                  cards.length > 0 ? 
                    formatNumber(cards.reduce((sum, card) => sum + (card.popReport?.totalPop || 0), 0)) :
                    "0"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                +5.7% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Cards Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>PSA Graded Cards Market Data</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <LoadingScreen message="Fetching card data..." />
              </div>
            ) : cards.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cert #</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Population</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Last Sale
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
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
                      <TableHead>
                        <div className="flex items-center">
                          Volume
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((card) => (
                      <TableRow 
                        key={card.certNumber}
                        className={`cursor-pointer hover:bg-muted ${selectedCard?.certNumber === card.certNumber ? 'bg-muted' : ''}`}
                        onClick={() => handleCardSelect(card)}
                      >
                        <TableCell className="font-medium">{card.certNumber}</TableCell>
                        <TableCell>{card.description}</TableCell>
                        <TableCell>PSA {card.grade}</TableCell>
                        <TableCell>{formatNumber(card.popReport?.totalPop)}</TableCell>
                        <TableCell>{formatCurrency(card.marketData?.lastSalePrice)}</TableCell>
                        <TableCell>{formatCurrency(card.marketData?.averagePrice)}</TableCell>
                        <TableCell>{formatCurrency(card.marketData?.marketCap)}</TableCell>
                        <TableCell>{formatNumber(card.marketData?.volume)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No cards found</h3>
                <p className="text-sm text-muted-foreground">
                  {token ? 
                    "Select a category to view PSA graded cards market data" :
                    "Please save your PSA API token first to view data"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Card Detail & Charts Section */}
        {selectedCard && (
          <Card>
            <CardHeader>
              <CardTitle>Card Details: {selectedCard.description}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Certificate</h4>
                      <p className="text-md">{selectedCard.certNumber}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Grade</h4>
                      <p className="text-md">PSA {selectedCard.grade}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Brand</h4>
                      <p className="text-md">{selectedCard.cardInfo.brand}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Year</h4>
                      <p className="text-md">{selectedCard.cardInfo.year}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                      <p className="text-md">{selectedCard.cardInfo.sport}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Card Name</h4>
                      <p className="text-md">{selectedCard.cardInfo.playerName}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold mb-2">Population Report</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Total Population</h4>
                        <p className="text-md">{formatNumber(selectedCard.popReport?.totalPop)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Higher Grade</h4>
                        <p className="text-md">{formatNumber(selectedCard.popReport?.popHigher)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Same Grade</h4>
                        <p className="text-md">{formatNumber(selectedCard.popReport?.popSame)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Lower Grade</h4>
                        <p className="text-md">{formatNumber(selectedCard.popReport?.popLower)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Tabs defaultValue="price">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="price">Price History</TabsTrigger>
                      <TabsTrigger value="volume">Trading Volume</TabsTrigger>
                    </TabsList>
                    <TabsContent value="price">
                      <div className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
                            margin={{
                              top: 10,
                              right: 30,
                              left: 0,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, 'Price']} />
                            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    <TabsContent value="volume">
                      <div className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="volume" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Last Sale Price</h4>
                      <p className="text-md">{formatCurrency(selectedCard.marketData?.lastSalePrice)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Last Sale Date</h4>
                      <p className="text-md">
                        {selectedCard.marketData?.lastSaleDate 
                          ? new Date(selectedCard.marketData.lastSaleDate).toLocaleDateString() 
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Average Price</h4>
                      <p className="text-md">{formatCurrency(selectedCard.marketData?.averagePrice)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Market Cap</h4>
                      <p className="text-md">{formatCurrency(selectedCard.marketData?.marketCap)}</p>
                    </div>
                  </div>
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
