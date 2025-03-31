import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MarketDataItem, marketDataService } from "@/services/marketDataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Pencil, Trash2, RefreshCw, ImageIcon, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingScreen from "@/components/ui/loading-screen";
import psaService from "@/services/psaService";

const marketDataSchema = z.object({
  card_name: z.string().min(1, "Card name is required"),
  grading_service: z.string().min(1, "Grading service is required"),
  population_10: z.number().optional(),
  population_9: z.number().optional(),
  population_8: z.number().optional(),
  population_7: z.number().optional(),
  population_6: z.number().optional(),
  population_5: z.number().optional(),
  population_4: z.number().optional(),
  population_3: z.number().optional(),
  population_2: z.number().optional(),
  population_1: z.number().optional(),
  population_auth: z.number().optional(),
  price_10: z.number().optional(),
  price_9: z.number().optional(),
  price_8: z.number().optional(),
  price_7: z.number().optional(),
  price_6: z.number().optional(),
  price_5: z.number().optional(),
  price_4: z.number().optional(),
  price_3: z.number().optional(),
  price_2: z.number().optional(),
  price_1: z.number().optional(),
  price_auth: z.number().optional(),
  card_image: z.string().optional(),
  language: z.string().optional(),
  year: z.string().optional(),
  franchise: z.string().optional(),
  series: z.string().optional(),
  card_set: z.string().optional(),
});

type MarketDataFormValues = z.infer<typeof marketDataSchema>;

const ManageMarket: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MarketDataItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [token, setToken] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const form = useForm<MarketDataFormValues>({
    resolver: zodResolver(marketDataSchema),
    defaultValues: {
      card_name: "",
      grading_service: "PSA",
      population_10: 0,
      population_9: 0,
      population_8: 0,
      population_7: 0,
      population_6: 0,
      population_5: 0,
      population_4: 0,
      population_3: 0,
      population_2: 0,
      population_1: 0,
      population_auth: 0,
      price_10: 0,
      price_9: 0,
      price_8: 0,
      price_7: 0,
      price_6: 0,
      price_5: 0,
      price_4: 0,
      price_3: 0,
      price_2: 0,
      price_1: 0,
      price_auth: 0,
      card_image: "",
      language: "English",
      year: "",
      franchise: "Pokemon",
      series: "",
      card_set: "",
    },
  });

  useEffect(() => {
    fetchMarketData();
    
    const savedToken = psaService.getToken();
    if (savedToken) {
      setToken(savedToken);
    }
    
    const lastUpdatedInfo = localStorage.getItem('psa_market_last_updated');
    if (lastUpdatedInfo) {
      setLastUpdated(lastUpdatedInfo);
    }
  }, []);

  useEffect(() => {
    if (selectedItem) {
      form.reset({
        card_name: selectedItem.card_name,
        grading_service: selectedItem.grading_service,
        population_10: selectedItem.population_10 || 0,
        population_9: selectedItem.population_9 || 0,
        population_8: selectedItem.population_8 || 0,
        population_7: selectedItem.population_7 || 0,
        population_6: selectedItem.population_6 || 0,
        population_5: selectedItem.population_5 || 0,
        population_4: selectedItem.population_4 || 0,
        population_3: selectedItem.population_3 || 0,
        population_2: selectedItem.population_2 || 0,
        population_1: selectedItem.population_1 || 0,
        population_auth: selectedItem.population_auth || 0,
        price_10: selectedItem.price_10 || 0,
        price_9: selectedItem.price_9 || 0,
        price_8: selectedItem.price_8 || 0,
        price_7: selectedItem.price_7 || 0,
        price_6: selectedItem.price_6 || 0,
        price_5: selectedItem.price_5 || 0,
        price_4: selectedItem.price_4 || 0,
        price_3: selectedItem.price_3 || 0,
        price_2: selectedItem.price_2 || 0,
        price_1: selectedItem.price_1 || 0,
        price_auth: selectedItem.price_auth || 0,
        card_image: selectedItem.card_image || "",
        language: selectedItem.language || "English",
        year: selectedItem.year || "",
        franchise: selectedItem.franchise || "Pokemon",
        series: selectedItem.series || "",
        card_set: selectedItem.card_set || "",
      });
    } else {
      form.reset({
        card_name: "",
        grading_service: "PSA",
        population_10: 0,
        population_9: 0,
        population_8: 0,
        population_7: 0,
        population_6: 0,
        population_5: 0,
        population_4: 0,
        population_3: 0,
        population_2: 0,
        population_1: 0,
        population_auth: 0,
        price_10: 0,
        price_9: 0,
        price_8: 0,
        price_7: 0,
        price_6: 0,
        price_5: 0,
        price_4: 0,
        price_3: 0,
        price_2: 0,
        price_1: 0,
        price_auth: 0,
        card_image: "",
        language: "English",
        year: "",
        franchise: "Pokemon",
        series: "",
        card_set: "",
      });
    }
  }, [selectedItem, form]);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      let data: MarketDataItem[];
      
      if (activeTab === "all") {
        data = await marketDataService.getMarketData();
      } else {
        data = await marketDataService.getMarketDataByGradingService(activeTab);
      }
      
      const processedData = data.map(card => ({
        ...card,
        total_population: card.total_population || calculateTotalPopulation(card),
        market_cap: card.market_cap || calculateMarketCap(card)
      }));
      
      setMarketData(processedData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      toast({
        title: "Error",
        description: "Failed to load market data",
        variant: "destructive",
      });
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

  const calculateMarketCap = (card: MarketDataItem): number => {
    let totalValue = 0;
    
    if (card.population_10 && card.price_10) totalValue += card.population_10 * card.price_10;
    if (card.population_9 && card.price_9) totalValue += card.population_9 * card.price_9;
    if (card.population_8 && card.price_8) totalValue += card.population_8 * card.price_8;
    if (card.population_7 && card.price_7) totalValue += card.population_7 * card.price_7;
    if (card.population_6 && card.price_6) totalValue += card.population_6 * card.price_6;
    if (card.population_5 && card.price_5) totalValue += card.population_5 * card.price_5;
    if (card.population_4 && card.price_4) totalValue += card.population_4 * card.price_4;
    if (card.population_3 && card.price_3) totalValue += card.population_3 * card.price_3;
    if (card.population_2 && card.price_2) totalValue += card.population_2 * card.price_2;
    if (card.population_1 && card.price_1) totalValue += card.population_1 * card.price_1;
    if (card.population_auth && card.price_auth) totalValue += card.population_auth * card.price_auth;
    
    return totalValue;
  };

  const handleCreateSubmit = async (values: MarketDataFormValues) => {
    try {
      await marketDataService.createMarketData(values as MarketDataItem);
      setIsEditDialogOpen(false);
      fetchMarketData();
    } catch (error) {
      console.error("Error creating market data:", error);
    }
  };

  const handleUpdateSubmit = async (values: MarketDataFormValues) => {
    if (!selectedItem?.id) return;

    try {
      await marketDataService.updateMarketData(selectedItem.id, values as MarketDataItem);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      fetchMarketData();
    } catch (error) {
      console.error("Error updating market data:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await marketDataService.deleteMarketData(deleteId);
      setDeleteId(null);
      fetchMarketData();
    } catch (error) {
      console.error("Error deleting market data:", error);
    }
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsEditDialogOpen(true);
  };

  const handleEdit = (item: MarketDataItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const updatePopulationData = async () => {
    if (!token) {
      toast({
        title: "API Token Required",
        description: "Please set your PSA API token first",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    psaService.setToken(token);
    
    try {
      const isConnected = await psaService.testPsaApiConnection();
      if (!isConnected) {
        throw new Error("Could not connect to PSA API. Please check your token.");
      }
      
      toast({
        title: "Update Started",
        description: "Updating population data for all cards...",
      });
      
      let updatedCards = 0;
      let updatedCount = 0;
      
      const updatedMarketData = [...marketData];
      
      for (let i = 0; i < marketData.length; i++) {
        const card = marketData[i];
        console.log(`Updating card ${i+1}/${marketData.length}: ${card.card_name}`);
        
        try {
          const certMatch = card.card_name.match(/PSA\s*#?\s*(\d+)/i);
          if (certMatch && certMatch[1]) {
            const certNumber = certMatch[1];
            console.log(`Found cert number ${certNumber} in card name`);
            
            const psaData = await psaService.callPsaApiDirect<any>(`/cert/GetByCertNumber/${certNumber}`);
            
            if (psaData && psaData.popReport) {
              console.log(`Got population data for cert ${certNumber}:`, psaData.popReport);
              
              updatedMarketData[i] = {
                ...card,
                population_10: psaData.popReport.pop10 || card.population_10,
                population_9: psaData.popReport.pop9 || card.population_9,
                population_8: psaData.popReport.pop8 || card.population_8,
                population_7: psaData.popReport.pop7 || card.population_7,
                population_6: psaData.popReport.pop6 || card.population_6,
                population_5: psaData.popReport.pop5 || card.population_5,
                population_4: psaData.popReport.pop4 || card.population_4,
                population_3: psaData.popReport.pop3 || card.population_3,
                population_2: psaData.popReport.pop2 || card.population_2,
                population_1: psaData.popReport.pop1 || card.population_1,
                population_auth: psaData.popReport.popA || card.population_auth,
                total_population: psaData.popReport.totalPop || calculateTotalPopulation(card)
              };
              
              await marketDataService.updateMarketData(card.id, updatedMarketData[i]);
              updatedCount++;
            }
          } else {
            console.log(`No cert number found in card name: ${card.card_name}`);
          }
          
          updatedCards++;
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (cardError) {
          console.error(`Error updating card ${card.card_name}:`, cardError);
        }
        
        if (updatedCards % 5 === 0 || updatedCards === marketData.length) {
          setMarketData([...updatedMarketData]);
        }
      }
      
      const now = new Date().toISOString();
      localStorage.setItem('psa_market_last_updated', now);
      setLastUpdated(now);
      
      toast({
        title: "Update Complete",
        description: `Updated population data for ${updatedCount} cards`,
      });
    } catch (error) {
      console.error("Error updating population data:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update population data",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [activeTab]);

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
  
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You must be an admin to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Manage Market Data</CardTitle>
              <CardDescription>
                Add, edit, or remove market data for cards
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchMarketData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleAddNew} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Card
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold">PSA API Integration</h3>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                <div className="flex-1">
                  <Label htmlFor="psa-token">PSA API Token</Label>
                  <Input
                    id="psa-token"
                    placeholder="Enter PSA API Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    type="password"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      psaService.setToken(token);
                      toast({
                        title: "Token Saved",
                        description: "PSA API token has been saved",
                      });
                    }} 
                    variant="outline"
                  >
                    Save Token
                  </Button>
                  <Button 
                    onClick={updatePopulationData} 
                    disabled={isUpdating || !token}
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Population Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Last data update: {formatDate(lastUpdated)}
                </p>
              )}
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="PSA">PSA</TabsTrigger>
                <TabsTrigger value="BGS">BGS</TabsTrigger>
                <TabsTrigger value="CGC">CGC</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <LoadingScreen message="Loading market data..." />
                ) : marketData.length > 0 ? (
                  <div className="rounded-md border">
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Card Name</TableHead>
                            <TableHead>Grading Service</TableHead>
                            <TableHead>Total Population</TableHead>
                            <TableHead>Market Cap</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marketData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.card_name}</TableCell>
                              <TableCell>{item.grading_service}</TableCell>
                              <TableCell>{formatNumber(item.total_population)}</TableCell>
                              <TableCell>{formatCurrency(item.market_cap)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    onClick={() => handleEdit(item)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        onClick={() => setDeleteId(item.id)}
                                        variant="destructive"
                                        size="sm"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {item.card_name}? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
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
                      Add your first market data entry to get started.
                    </p>
                    <Button onClick={handleAddNew}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Market Data
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem ? "Edit Market Data" : "Add New Market Data"}</DialogTitle>
              <DialogDescription>
                {selectedItem
                  ? `Update information for ${selectedItem.card_name}`
                  : "Add a new card to the market data"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(selectedItem ? handleUpdateSubmit : handleCreateSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="card_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grading_service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grading Service</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="card_image"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Card Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="franchise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Franchise</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="series"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Series</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="card_set"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Set</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />
                
                <h3 className="text-lg font-semibold mb-2">Population Data</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((grade) => (
                    <FormField
                      key={`population_${grade}`}
                      control={form.control}
                      name={`population_${grade}` as keyof MarketDataFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pop ({grade})</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <FormField
                    control={form.control}
                    name="population_auth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pop (Auth)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />
                
                <h3 className="text-lg font-semibold mb-2">Price Data</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((grade) => (
                    <FormField
                      key={`price_${grade}`}
                      control={form.control}
                      name={`price_${grade}` as keyof MarketDataFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ({grade})</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <FormField
                    control={form.control}
                    name="price_auth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (Auth)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="mt-6">
                  <Button type="submit">{selectedItem ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ManageMarket;
