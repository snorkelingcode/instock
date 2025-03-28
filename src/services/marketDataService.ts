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
  language?: string;
  year?: string;
  franchise?: string;
  series?: string;
  card_set?: string;
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

      // Process data to ensure total_population and market_cap are calculated if missing
      const processedData = data.map(card => {
        const totalPopulation = card.total_population !== null && card.total_population !== undefined 
          ? card.total_population 
          : calculateTotalPopulation(card);

        const marketCap = card.market_cap !== null && card.market_cap !== undefined
          ? card.market_cap
          : calculateMarketCap(card);

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
      
      if (data) {
        // Ensure total_population and market_cap are calculated if missing
        const totalPopulation = data.total_population !== null && data.total_population !== undefined
          ? data.total_population
          : calculateTotalPopulation(data);
          
        const marketCap = data.market_cap !== null && data.market_cap !== undefined
          ? data.market_cap
          : calculateMarketCap(data);
        
        return {
          ...data,
          total_population: totalPopulation,
          market_cap: marketCap
        };
      }
      
      return null;
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
      // Always calculate total_population and market_cap when creating
      marketData.total_population = calculateTotalPopulation(marketData);
      marketData.market_cap = calculateMarketCap(marketData);
      
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
      // Always calculate total_population and market_cap when updating
      marketData.total_population = calculateTotalPopulation(marketData);
      marketData.market_cap = calculateMarketCap(marketData);
      
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
        
        // Process data to ensure total_population and market_cap are calculated if missing
        const processedData = data.map(card => {
          const totalPopulation = card.total_population !== null && card.total_population !== undefined
            ? card.total_population
            : calculateTotalPopulation(card);
            
          const marketCap = card.market_cap !== null && card.market_cap !== undefined
            ? card.market_cap
            : calculateMarketCap(card);

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

function calculateMarketCap(data: MarketDataItem): number {
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
}

export default marketDataService;
