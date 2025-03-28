import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, BarChartIcon, DollarSign, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MarketDataItem, marketDataService } from "@/services/marketDataService";
import LoadingScreen from "@/components/ui/loading-screen";
import { Grid } from "@/components/ui/grid";

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

const PSACardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [card, setCard] = useState<MarketDataItem | null>(
    location.state?.card || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!location.state?.card);
  const [priceComparisonData, setPriceComparisonData] = useState<any[]>([]);
  const [populationComparisonData, setPopulationComparisonData] = useState<any[]>([]);
  
  useEffect(() => {
    if (!card && id) {
      fetchCardData(id);
    } else if (card) {
      setPriceComparisonData(generatePriceComparisonData(card));
      setPopulationComparisonData(generatePopulationComparisonData(card));
    }
  }, [card, id]);
  
  const fetchCardData = async (cardId: string) => {
    try {
      setIsLoading(true);
      const fetchedCard = await marketDataService.getMarketDataById(cardId);
      
      if (fetchedCard) {
        setCard(fetchedCard);
        setPriceComparisonData(generatePriceComparisonData(fetchedCard));
        setPopulationComparisonData(generatePopulationComparisonData(fetchedCard));
      } else {
        toast({
          title: "Error",
          description: "Card not found",
          variant: "destructive",
        });
        navigate("/psa-market");
      }
    } catch (error) {
      console.error("Error fetching card data:", error);
      toast({
        title: "Error",
        description: "Failed to load card data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-12">
          <LoadingScreen message="Loading card data..." />
        </div>
      </Layout>
    );
  }
  
  if (!card) {
    return (
      <Layout>
        <div className="container mx-auto py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Card Not Found</h2>
                <p className="mb-4">The card you're looking for could not be found.</p>
                <Button onClick={() => navigate("/psa-market")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Market
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full">
            <Button 
              variant="outline" 
              onClick={() => navigate("/psa-market")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Market
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words line-clamp-2 md:line-clamp-none">{card.card_name}</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Card Details</CardTitle>
            <CardDescription className="break-words">
              Detailed market information for {card.card_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {card.card_image && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={card.card_image} 
                      alt={card.card_name} 
                      className="rounded-lg shadow-md max-h-96 object-contain"
                    />
                  </div>
                )}
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Card Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Card Name</h4>
                        <p className="text-md font-medium break-words">{card.card_name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Grading Service</h4>
                        <p className="text-md font-medium">{card.grading_service}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Total Population</h4>
                        <p className="text-md font-medium">{formatNumber(card.total_population)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Market Cap</h4>
                        <p className="text-md font-medium truncate" title={formatCurrency(card.market_cap)}>
                          {formatCurrency(card.market_cap)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Population Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(grade => (
                        <div key={`pop-${grade}`} className="flex flex-col">
                          <h4 className="text-sm font-medium text-muted-foreground">Grade {grade}</h4>
                          <p className="text-md font-medium">
                            {formatNumber(card[`population_${grade}` as keyof MarketDataItem] as number)}
                          </p>
                        </div>
                      ))}
                      <div className="flex flex-col">
                        <h4 className="text-sm font-medium text-muted-foreground">Authentic</h4>
                        <p className="text-md font-medium">{formatNumber(card.population_auth)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Grid className="grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate" title={formatCurrency(card.market_cap)}>
                        {formatCurrency(card.market_cap)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total market value
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
                      <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate" title={formatCurrency(getHighestPrice(card))}>
                        {formatCurrency(getHighestPrice(card))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Top graded price
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Population</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate" title={formatNumber(card.total_population)}>
                        {formatNumber(card.total_population)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total graded cards
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Gem Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {((card.population_10 || 0) / (card.total_population || 1) * 100).toFixed(2)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PSA 10 percentage
                      </p>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Card>
                  <CardContent className="pt-6">
                    <Tabs defaultValue="price">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="price" className="text-xs sm:text-sm whitespace-normal h-auto py-2">Price Analysis</TabsTrigger>
                        <TabsTrigger value="population" className="text-xs sm:text-sm whitespace-normal h-auto py-2">Population Analysis</TabsTrigger>
                      </TabsList>
                      <TabsContent value="price">
                        <div className="h-[400px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={priceComparisonData}
                              margin={{
                                top: 20,
                                right: isMobile ? 5 : 20,
                                left: isMobile ? 5 : 15,
                                bottom: isMobile ? 100 : 70,
                              }}
                              barSize={isMobile ? 20 : 35}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="grade" 
                                angle={-45} 
                                textAnchor="end" 
                                height={isMobile ? 100 : 80}
                                interval={0}
                                fontSize={isMobile ? 8 : 12}
                                tickMargin={isMobile ? 18 : 5}
                                tickSize={isMobile ? 5 : 10}
                                tickFormatter={(value) => {
                                  if (isMobile) {
                                    if (value === "Authentic") return "Auth";
                                    return value.replace("Grade ", "");
                                  }
                                  return value;
                                }}
                              />
                              <YAxis 
                                tickFormatter={(value) => formatChartCurrency(value)}
                                width={isMobile ? 65 : 80}
                                fontSize={isMobile ? 8 : 12}
                                tickCount={isMobile ? 4 : 6}
                              />
                              <RechartsTooltip 
                                formatter={(value: any) => [`${formatCurrency(value)}`, 'Price']} 
                                labelFormatter={(label) => `${label}`}
                                contentStyle={{ fontSize: isMobile ? 10 : 12 }}
                              />
                              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}/>
                              <Bar 
                                dataKey="price" 
                                name="Price" 
                                fill="#ea384c" 
                                label={isMobile ? null : {
                                  position: 'top',
                                  formatter: (value: any) => {
                                    if (value >= 1000000) {
                                      return `$${Math.round(value / 1000000)}M`;
                                    } 
                                    if (value >= 100000) {
                                      return `$${Math.round(value / 1000)}K`;
                                    } else if (value >= 1000) {
                                      return `$${(value / 1000).toFixed(1)}K`;
                                    }
                                    return value.toLocaleString();
                                  },
                                  fontSize: 11,
                                  fill: '#666',
                                  offset: 5,
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Price Highlights</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold">Highest Grade Price</p>
                              <p className="text-md truncate" title={card.price_10 ? formatCurrency(card.price_10) : 'N/A'}>
                                {card.price_10 ? formatCurrency(card.price_10) : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Price Difference (10 to 9)</p>
                              {card.price_10 && card.price_9 ? (
                                <p className="text-md">
                                  <span className="truncate block" title={formatCurrency(card.price_10 - card.price_9)}>
                                    {formatCurrency(card.price_10 - card.price_9)}
                                  </span>
                                  <span className="whitespace-nowrap text-xs sm:text-sm">
                                    ({Math.round(((card.price_10 / card.price_9) - 1) * 100)}%)
                                  </span>
                                </p>
                              ) : (
                                <p className="text-md">N/A</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="population">
                        <div className="h-[400px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={populationComparisonData}
                              margin={{
                                top: 20,
                                right: isMobile ? 5 : 20,
                                left: isMobile ? 5 : 15,
                                bottom: isMobile ? 100 : 70,
                              }}
                              barSize={isMobile ? 20 : 35}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="grade" 
                                angle={-45} 
                                textAnchor="end" 
                                height={isMobile ? 100 : 80}
                                interval={0}
                                fontSize={isMobile ? 8 : 12}
                                tickMargin={isMobile ? 18 : 5}
                                tickSize={isMobile ? 5 : 10}
                                tickFormatter={(value) => {
                                  if (isMobile) {
                                    if (value === "Authentic") return "Auth";
                                    return value.replace("Grade ", "");
                                  }
                                  return value;
                                }}
                              />
                              <YAxis 
                                tickFormatter={(value) => formatChartNumber(value)}
                                width={isMobile ? 65 : 80}
                                fontSize={isMobile ? 8 : 12}
                                tickCount={isMobile ? 4 : 6}
                              />
                              <RechartsTooltip 
                                formatter={(value: any) => [`${formatNumber(value)}`, 'Population']} 
                                labelFormatter={(label) => `${label}`}
                                contentStyle={{ fontSize: isMobile ? 10 : 12 }}
                              />
                              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}/>
                              <Bar 
                                dataKey="population" 
                                name="Population" 
                                fill="#ea384c"
                                label={isMobile ? null : {
                                  position: 'top',
                                  formatter: (value: any) => {
                                    if (value >= 1000) {
                                      return `${Math.round(value / 1000)}K`;
                                    }
                                    return value;
                                  },
                                  fontSize: 11,
                                  fill: '#666',
                                  offset: 5,
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Population Highlights</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold">Highest Population Grade</p>
                              {(() => {
                                const grades = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                                const highestGrade = grades.reduce((prev, current) => {
                                  const prevValue = card[`population_${prev}` as keyof MarketDataItem] as number || 0;
                                  const currentValue = card[`population_${current}` as keyof MarketDataItem] as number || 0;
                                  return currentValue > prevValue ? current : prev;
                                }, 10);
                                
                                return (
                                  <p className="text-md break-words">
                                    Grade {highestGrade} ({formatNumber(card[`population_${highestGrade}` as keyof MarketDataItem] as number)})
                                  </p>
                                );
                              })()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Population Ratio (Gem Mint/Total)</p>
                              <p className="text-md">
                                {(((card.population_10 || 0) / (card.total_population || 1)) * 100).toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PSACardDetails;
