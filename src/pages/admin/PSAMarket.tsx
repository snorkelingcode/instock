
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";  // Changed from { Layout } to default import
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
import psaService, { PSACard, PSASearchParams } from "@/services/psaService";

// Mock data for charts
const generateMockChartData = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    name: new Date(2023, i, 1).toLocaleString('default', { month: 'short' }),
    value: Math.floor(Math.random() * 10000),
    volume: Math.floor(Math.random() * 500)
  }));
};

const PSAMarket: React.FC = () => {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cards, setCards] = useState<PSACard[]>([]);
  const [searchParams, setSearchParams] = useState<PSASearchParams>({
    brand: "",
    year: "",
    sport: "",
    playerName: "",
    page: 1,
    pageSize: 20
  });
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
  
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        description: `${searchParams.year || "2020"} ${searchParams.brand || "Topps"} ${searchParams.playerName || "Sample Player"} #${searchParams.cardNumber || i + 1}`,
        cardInfo: {
          brand: searchParams.brand || "Topps",
          year: searchParams.year || "2020",
          sport: searchParams.sport || "Baseball",
          cardNumber: searchParams.cardNumber || String(i + 1),
          playerName: searchParams.playerName || "Sample Player"
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
      setCards(enrichedCards);
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
  
  return (
    <Layout title="PSA Market">
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
        
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Search PSA Graded Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={searchParams.brand}
                    onChange={(e) => setSearchParams({...searchParams, brand: e.target.value})}
                    placeholder="Topps, Panini, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={searchParams.year}
                    onChange={(e) => setSearchParams({...searchParams, year: e.target.value})}
                    placeholder="2020, 1990, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <Input
                    id="sport"
                    value={searchParams.sport}
                    onChange={(e) => setSearchParams({...searchParams, sport: e.target.value})}
                    placeholder="Baseball, Football, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="playerName">Player Name</Label>
                  <Input
                    id="playerName"
                    value={searchParams.playerName}
                    onChange={(e) => setSearchParams({...searchParams, playerName: e.target.value})}
                    placeholder="Player name"
                  />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={searchParams.cardNumber}
                    onChange={(e) => setSearchParams({...searchParams, cardNumber: e.target.value})}
                    placeholder="Card number"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={searchParams.grade}
                    onChange={(e) => setSearchParams({...searchParams, grade: e.target.value})}
                    placeholder="10, 9, 8, etc."
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                  {isLoading ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </form>
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
                {cards.length > 0 ? 
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
                {cards.length > 0 ? 
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
                {cards.length > 0 ? 
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
                {cards.length > 0 ? 
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
                        className="cursor-pointer hover:bg-muted"
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
                  Use the search form above to find PSA graded cards market data
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
                      <h4 className="text-sm font-medium text-muted-foreground">Sport</h4>
                      <p className="text-md">{selectedCard.cardInfo.sport}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Player</h4>
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
