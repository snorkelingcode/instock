import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MarketDataItem {
  id: string;
  card_name: string;
  grading_service: string;
  population_10?: number;
  population_9?: number;
  population_8?: number;
  population_7?: number;
  population_6?: number;
  population_5?: number;
  population_4?: number;
  population_3?: number;
  population_2?: number;
  population_1?: number;
  population_auth?: number;
  price_10?: number;
  price_9?: number;
  price_8?: number;
  price_7?: number;
  price_6?: number;
  price_5?: number;
  price_4?: number;
  price_3?: number;
  price_2?: number;
  price_1?: number;
  price_auth?: number;
  card_image?: string;
  market_cap?: number;
  total_population?: number;
  created_at?: string;
  updated_at?: string;
}

export const marketDataService = {
  getMarketData: async (): Promise<MarketDataItem[]> => {
    try {
      console.log("Fetching all market data");
      
      // Using URL from environment for debugging
      console.log("Using Supabase service to fetch data");
      
      const { data, error } = await supabase
        .from("market_data")
        .select("*")
        .order("card_name", { ascending: true });

      console.log("Raw Supabase Query Result:", { data, error });

      if (error) {
        console.error("Error fetching market data:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      const processedData = data.map(card => {
        const totalPopulation = [
          card.population_10,
          card.population_9,
          card.population_8,
          card.population_7,
          card.population_6,
          card.population_5,
          card.population_4,
          card.population_3,
          card.population_2,
          card.population_1,
          card.population_auth
        ].reduce((sum, pop) => sum + (pop || 0), 0);

        let marketCap = 0;
        if (card.population_10 && card.price_10) marketCap += card.population_10 * card.price_10;
        if (card.population_9 && card.price_9) marketCap += card.population_9 * card.price_9;
        if (card.population_8 && card.price_8) marketCap += card.population_8 * card.price_8;
        if (card.population_7 && card.price_7) marketCap += card.population_7 * card.price_7;
        if (card.population_6 && card.price_6) marketCap += card.population_6 * card.price_6;
        if (card.population_5 && card.price_5) marketCap += card.population_5 * card.price_5;
        if (card.population_4 && card.price_4) marketCap += card.population_4 * card.price_4;
        if (card.population_3 && card.price_3) marketCap += card.population_3 * card.price_3;
        if (card.population_2 && card.price_2) marketCap += card.population_2 * card.price_2;
        if (card.population_1 && card.price_1) marketCap += card.population_1 * card.price_1;
        if (card.population_auth && card.price_auth) marketCap += card.population_auth * card.price_auth;

        return {
          ...card,
          total_population: totalPopulation,
          market_cap: marketCap
        };
      });

      return processedData;
    } catch (error) {
      console.error("Unexpected error in getMarketData:", error);
      return [];
    }
  },

  getMarketDataById: async (id: string): Promise<MarketDataItem | null> => {
    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Error fetching market data with ID ${id}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch market data",
        variant: "destructive",
      });
      return null;
    }
  },

  createMarketData: async (marketData: MarketDataItem): Promise<string | null> => {
    try {
      marketData.total_population = calculateTotalPopulation(marketData);
      
      if (marketData.total_population) {
        const avgPrice = calculateAveragePrice(marketData);
        if (avgPrice) {
          marketData.market_cap = marketData.total_population * avgPrice;
        }
      }
      
      const { data, error } = await supabase
        .from('market_data')
        .insert(marketData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Market data created successfully",
      });
      
      return data?.id || null;
    } catch (error) {
      console.error('Error creating market data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create market data",
        variant: "destructive",
      });
      return null;
    }
  },

  updateMarketData: async (id: string, marketData: MarketDataItem): Promise<boolean> => {
    try {
      marketData.total_population = calculateTotalPopulation(marketData);
      
      if (marketData.total_population) {
        const avgPrice = calculateAveragePrice(marketData);
        if (avgPrice) {
          marketData.market_cap = marketData.total_population * avgPrice;
        }
      }
      
      const { error } = await supabase
        .from('market_data')
        .update(marketData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Market data updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating market data with ID ${id}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update market data",
        variant: "destructive",
      });
      return false;
    }
  },

  deleteMarketData: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('market_data')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Market data deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting market data with ID ${id}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete market data",
        variant: "destructive",
      });
      return false;
    }
  },

  getMarketDataByGradingService: async (gradingService: string): Promise<MarketDataItem[]> => {
    try {
      console.log(`Fetching market data for ${gradingService}`);
      console.log("Using Supabase client for query");
      
      // Check if the market_data table exists by attempting to count rows
      console.log("Checking for market_data table existence");
      
      const { data, error } = await supabase
        .from("market_data")
        .select("*")
        .ilike("grading_service", gradingService)
        .order("card_name", { ascending: true });

      console.log('Raw Supabase Query Result:', { data, error });

      if (error) {
        console.error(`Error fetching ${gradingService} market data:`, error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      if (data && data.length > 0) {
        console.log(`Found ${data.length} ${gradingService} market data records`);
        
        const processedData = data.map(card => {
          const totalPopulation = [
            card.population_10,
            card.population_9,
            card.population_8,
            card.population_7,
            card.population_6,
            card.population_5,
            card.population_4,
            card.population_3,
            card.population_2,
            card.population_1,
            card.population_auth
          ].reduce((sum, pop) => sum + (pop || 0), 0);

          let marketCap = 0;
          if (card.population_10 && card.price_10) marketCap += card.population_10 * card.price_10;
          if (card.population_9 && card.price_9) marketCap += card.population_9 * card.price_9;
          if (card.population_8 && card.price_8) marketCap += card.population_8 * card.price_8;
          if (card.population_7 && card.price_7) marketCap += card.population_7 * card.price_7;
          if (card.population_6 && card.price_6) marketCap += card.population_6 * card.price_6;
          if (card.population_5 && card.price_5) marketCap += card.population_5 * card.price_5;
          if (card.population_4 && card.price_4) marketCap += card.population_4 * card.price_4;
          if (card.population_3 && card.price_3) marketCap += card.population_3 * card.price_3;
          if (card.population_2 && card.price_2) marketCap += card.population_2 * card.price_2;
          if (card.population_1 && card.price_1) marketCap += card.population_1 * card.price_1;
          if (card.population_auth && card.price_auth) marketCap += card.population_auth * card.price_auth;

          return {
            ...card,
            total_population: totalPopulation,
            market_cap: marketCap
          };
        });

        return processedData;
      } else {
        console.log(`No ${gradingService} market data found in database`);
        return [];
      }
    } catch (error) {
      console.error("Unexpected error in getMarketDataByGradingService:", error);
      return [];
    }
  }
};

function calculateTotalPopulation(data: MarketDataItem): number {
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
}

function calculateAveragePrice(data: MarketDataItem): number | null {
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
}

export default marketDataService;
