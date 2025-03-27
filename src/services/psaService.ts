
import { toast } from "@/hooks/use-toast";

// PSA API base URL - Updated to correct endpoint
const PSA_API_BASE_URL = "https://api.psacard.com/api";

// Types for PSA API responses
export interface PSACard {
  certNumber: string;
  certDate: string;
  grade: string;
  description: string;
  cardInfo: {
    brand: string;
    year: string;
    sport: string;
    cardNumber: string;
    playerName: string;
  };
  popReport?: {
    totalPop: number;
    popHigher: number;
    popSame: number;
    popLower: number;
  };
  marketData?: {
    lastSalePrice?: number;
    lastSaleDate?: string;
    averagePrice?: number;
    marketCap?: number;
    volume?: number;
  };
}

export interface PSASearchParams {
  brand?: string;
  year?: string;
  sport?: string;
  playerName?: string;
  cardNumber?: string;
  grade?: string;
  page?: number;
  pageSize?: number;
  language?: string;
}

// Service for PSA API calls
export const psaService = {
  // Get access token from localStorage
  getToken: () => {
    return localStorage.getItem("psa_access_token");
  },
  
  // Save access token to localStorage
  setToken: (token: string) => {
    localStorage.setItem("psa_access_token", token);
  },
  
  // Generic function to make API calls to PSA
  callApi: async <T>(endpoint: string, method: string = "GET", body?: any): Promise<T> => {
    const token = psaService.getToken();
    
    if (!token) {
      throw new Error("No PSA access token found. Please set your token first.");
    }
    
    try {
      console.log(`Calling PSA API: ${PSA_API_BASE_URL}${endpoint}`);
      const response = await fetch(`${PSA_API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PSA API error: ${error}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error("PSA API call failed:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to fetch data from PSA",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // Get card by cert number - Updated endpoint format
  getCardByCertNumber: async (certNumber: string): Promise<PSACard> => {
    return psaService.callApi<PSACard>(`/cert/${certNumber}`);
  },
  
  // Search for cards - Updated endpoint format
  searchCards: async (params: PSASearchParams): Promise<{items: PSACard[], total: number}> => {
    // Always ensure we're searching for English cards
    const searchParams: PSASearchParams = {
      ...params,
      language: "English"
    };
    
    // Create query string from params
    const queryParams = Object.entries(searchParams)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");
    
    return psaService.callApi<{items: PSACard[], total: number}>(`/cert/items?${queryParams}`);
  },
  
  // Search cards by category - Updated to match new endpoint structure
  searchCardsByCategory: async (category: string, page: number = 1, pageSize: number = 20): Promise<{items: PSACard[], total: number}> => {
    try {
      // For demo purposes, if we encounter API issues, fall back to mock data
      try {
        const result = await psaService.searchCards({
          sport: category,
          language: "English",
          page,
          pageSize
        });
        
        return result;
      } catch (apiError) {
        console.warn("Using mock data due to API error:", apiError);
        return psaService.getMockCardsByCategory(category, page, pageSize);
      }
    } catch (error) {
      console.error(`Error searching cards by category ${category}:`, error);
      throw error;
    }
  },
  
  // Get mock cards by category as a fallback when the API fails
  getMockCardsByCategory: async (category: string, page: number = 1, pageSize: number = 20): Promise<{items: PSACard[], total: number}> => {
    // Generate mock cards based on the category
    const mockCards: PSACard[] = Array.from({ length: pageSize }, (_, i) => ({
      certNumber: `${10000000 + i}`,
      certDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      grade: String(Math.floor(Math.random() * 5) + 6),
      description: `${category} ${["Rare", "Foil", "Legendary", "Common", "Uncommon"][i % 5]} Card #${i + 1}`,
      cardInfo: {
        brand: category === "Pokemon" ? "Pokemon TCG" : 
               category === "Magic The Gathering" ? "Wizards of the Coast" : 
               category === "Yu-Gi-Oh!" ? "Konami" :
               category === "Disney Lorcana" ? "Ravensburger" : 
               "Bandai",
        year: String(2000 + Math.floor(Math.random() * 23)),
        sport: category,
        cardNumber: String(i + 1),
        playerName: `${["Character", "Monster", "Hero", "Villain", "Creature"][i % 5]} ${i + 1}`
      },
      popReport: {
        totalPop: Math.floor(Math.random() * 1000) + 10,
        popHigher: Math.floor(Math.random() * 100),
        popSame: Math.floor(Math.random() * 500),
        popLower: Math.floor(Math.random() * 200)
      }
    }));
    
    // Sort by random market cap
    const mockCardsWithMarketData = psaService.enrichWithMarketData(mockCards)
      .sort((a, b) => (b.marketData?.marketCap || 0) - (a.marketData?.marketCap || 0));
      
    return {
      items: mockCardsWithMarketData,
      total: 100 // Mock total
    };
  },
  
  // Enrich with market data since the actual API doesn't provide this
  enrichWithMarketData: (cards: PSACard[]): PSACard[] => {
    return cards.map(card => ({
      ...card,
      marketData: {
        lastSalePrice: Math.round(Math.random() * 10000) / 100,
        lastSaleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        averagePrice: Math.round(Math.random() * 12000) / 100,
        marketCap: Math.round(card.popReport?.totalPop || 0) * Math.round(Math.random() * 15000) / 100,
        volume: Math.round(Math.random() * 100)
      }
    }));
  }
};

export default psaService;
