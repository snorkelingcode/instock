
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MarketDataItem {
  id?: string;
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
  total_population?: number;
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
  market_cap?: number;
  card_image?: string;
  created_at?: string;
  updated_at?: string;
}

export const marketDataService = {
  // Get all market data entries
  getMarketData: async (): Promise<MarketDataItem[]> => {
    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .order('card_name', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch market data",
        variant: "destructive",
      });
      return [];
    }
  },
  
  // Get market data by ID
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
  
  // Create a new market data entry
  createMarketData: async (marketData: MarketDataItem): Promise<string | null> => {
    try {
      // Calculate total population
      marketData.total_population = calculateTotalPopulation(marketData);
      
      // Calculate market cap if all necessary data is present
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
  
  // Update an existing market data entry
  updateMarketData: async (id: string, marketData: MarketDataItem): Promise<boolean> => {
    try {
      // Calculate total population
      marketData.total_population = calculateTotalPopulation(marketData);
      
      // Calculate market cap if all necessary data is present
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
  
  // Delete a market data entry
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

  // Get market data by grading service
  getMarketDataByGradingService: async (gradingService: string): Promise<MarketDataItem[]> => {
    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('grading_service', gradingService)
        .order('card_name', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Error fetching market data for grading service ${gradingService}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch market data",
        variant: "destructive",
      });
      return [];
    }
  }
};

// Helper function to calculate total population
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

// Helper function to calculate average price
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
