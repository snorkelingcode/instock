
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { MarketDataItem } from "@/services/marketDataService";
import MarketStatistics from "@/components/market/MarketStatistics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { setCache, getCache } from "@/utils/cacheUtils";

// Cache keys and duration
const MARKET_PARTITION = "market";
const MARKET_DATA_KEY = 'marketDataItems';
const CACHE_DURATION_MINUTES = 24 * 60; // 24 hours

const Market = () => {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [pokemonData, setPokemonData] = useState<MarketDataItem[]>([]);
  const [mtgData, setMtgData] = useState<MarketDataItem[]>([]);
  const [yugiohData, setYugiohData] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Set meta tags for SEO
  useMetaTags({
    title: "TCG Market Data | Trading Card Game Market Analysis",
    description: "Market data and analysis for trading card games including Pokémon, Magic: The Gathering, and Yu-Gi-Oh! Track population reports, market caps, and grading statistics.",
    keywords: "TCG market data, Pokémon card market, Magic The Gathering market, Yu-Gi-Oh market analysis, PSA grading statistics, card market cap",
    ogTitle: "TCG Market Data | Trading Card Game Market Analysis",
    ogDescription: "Comprehensive market data and analysis for popular trading card games.",
    canonicalUrl: "https://tcgupdates.com/market",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Trading Card Game Market Data",
      "description": "Market statistics and population reports for trading card games",
      "url": "https://tcgupdates.com/market",
      "keywords": ["TCG", "market data", "Pokémon", "Magic The Gathering", "Yu-Gi-Oh", "market analysis"]
    }
  });
  
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        
        // Check if we have cached data
        const cachedData = getCache<MarketDataItem[]>(MARKET_DATA_KEY, MARKET_PARTITION);
        
        // If we have cached data, use it but still fetch fresh data in the background
        if (cachedData) {
          console.log("Using cached market data");
          processMarketData(cachedData);
          setLoading(false);
        }
        
        // Always fetch fresh data from the database
        console.log("Fetching fresh market data");
        const { data, error } = await supabase
          .from('market_data')
          .select('*')
          .order('market_cap', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Update state and cache with fresh data
        if (data) {
          console.log("Fresh market data received:", data.length, "items");
          // Type-safe conversion to MarketDataItem array
          const typedData = data as MarketDataItem[];
          processMarketData(typedData);
          setCache(MARKET_DATA_KEY, typedData, CACHE_DURATION_MINUTES, MARKET_PARTITION);
        }
        
      } catch (error) {
        console.error('Error fetching market data:', error);
        toast({
          title: "Error",
          description: "Failed to load market data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketData();
  }, [toast]);
  
  const processMarketData = (data: MarketDataItem[]) => {
    setMarketData(data);
    
    // Filter data by franchise
    setPokemonData(data.filter(item => item.franchise?.toLowerCase() === 'pokemon'));
    setMtgData(data.filter(item => item.franchise?.toLowerCase() === 'magic the gathering' || item.franchise?.toLowerCase() === 'mtg'));
    setYugiohData(data.filter(item => item.franchise?.toLowerCase() === 'yu-gi-oh' || item.franchise?.toLowerCase() === 'yugioh'));
  };

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-2">TCG Market Data</h1>
        <p className="text-gray-700 mb-6">
          Track and analyze market trends for trading cards across different games. The data below shows market caps, population reports, and grade distributions.
        </p>
        
        {loading ? (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Loading Market Data</AlertTitle>
            <AlertDescription className="text-blue-700">
              Please wait while we fetch the latest market information.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="all" className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Cards</TabsTrigger>
              <TabsTrigger value="pokemon">Pokémon</TabsTrigger>
              <TabsTrigger value="mtg">Magic: The Gathering</TabsTrigger>
              <TabsTrigger value="yugioh">Yu-Gi-Oh!</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <h2 className="text-xl font-semibold mb-4">All Trading Cards</h2>
              <MarketStatistics marketData={marketData} />
              
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      This data represents aggregated statistics across all trading card games tracked in our system.
                      The total market capitalization is calculated based on population reports and current market values.
                    </p>
                    <p className="mt-2">
                      Top performing cards are typically those with high gem rates and lower populations, creating scarcity in the market.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="pokemon">
              <h2 className="text-xl font-semibold mb-4">Pokémon Cards</h2>
              <MarketStatistics marketData={pokemonData} />
              
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Pokémon Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Pokémon cards continue to show strong market performance, particularly for vintage sets and chase cards from the modern era.
                      Gem rates for Pokémon cards tend to be lower than other TCGs due to their age and print quality.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="mtg">
              <h2 className="text-xl font-semibold mb-4">Magic: The Gathering Cards</h2>
              <MarketStatistics marketData={mtgData} />
              
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Magic: The Gathering Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Reserved List cards from Magic: The Gathering show consistent growth over time.
                      Foil cards and special treatments often command significant premiums over their non-foil counterparts.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="yugioh">
              <h2 className="text-xl font-semibold mb-4">Yu-Gi-Oh! Cards</h2>
              <MarketStatistics marketData={yugiohData} />
              
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Yu-Gi-Oh! Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Yu-Gi-Oh! cards show interesting market patterns with competitive play driving significant price movements.
                      First edition cards and tournament staples typically maintain strong value over time.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Market Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Market Cap</strong>: The total estimated value of all graded cards of a particular type.
                </li>
                <li>
                  <strong>Total Population</strong>: The number of cards that have been graded and are in circulation.
                </li>
                <li>
                  <strong>PSA 10 Population</strong>: The number of cards that have received a perfect PSA 10 grade.
                </li>
                <li>
                  <strong>Gem Rate</strong>: The percentage of cards that received a PSA 10 grade out of the total population.
                </li>
              </ul>
              <p className="mt-4">
                This market data is updated regularly to provide the most accurate insights into the trading card market.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Market;
