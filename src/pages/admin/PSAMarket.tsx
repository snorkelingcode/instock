
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingScreen from "@/components/ui/loading-screen";
import { psaService } from "@/services/psaService";
import { ImageIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PSAMarket: React.FC = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("PSA");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchMarketData();
  }, [activeTab]);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      let data: any[];
      
      if (activeTab === "all") {
        data = await psaService.getMarketData();
      } else {
        data = await psaService.getMarketDataByGradingService(activeTab);
      }
      
      setMarketData(data);
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    return new Intl.NumberFormat('en-US').format(value);
  };

  const filteredMarketData = marketData.filter(item => 
    item.card_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">PSA Market Data</CardTitle>
            <CardDescription>
              Current market data for graded trading cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cards..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Tabs defaultValue="PSA" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="PSA">PSA</TabsTrigger>
                <TabsTrigger value="BGS">BGS</TabsTrigger>
                <TabsTrigger value="CGC">CGC</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <LoadingScreen message="Loading market data..." />
                ) : filteredMarketData.length > 0 ? (
                  <div className="rounded-md border">
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Card Name</TableHead>
                            <TableHead>Grading Service</TableHead>
                            <TableHead>Total Population</TableHead>
                            <TableHead>PSA 10 Pop</TableHead>
                            <TableHead>PSA 10 Price</TableHead>
                            <TableHead>Market Cap</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMarketData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.card_name}</TableCell>
                              <TableCell>{item.grading_service}</TableCell>
                              <TableCell>{formatNumber(item.total_population)}</TableCell>
                              <TableCell>{formatNumber(item.population_10)}</TableCell>
                              <TableCell>{formatCurrency(item.price_10)}</TableCell>
                              <TableCell>{formatCurrency(item.market_cap)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No market data found</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                      {searchTerm ? "No results match your search. Try different keywords." : "No market data available for this grading service."}
                    </p>
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm("")}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PSAMarket;
