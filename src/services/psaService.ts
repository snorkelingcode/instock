
import { toast } from "@/hooks/use-toast";

// PSA API base URL
const PSA_API_BASE_URL = "https://api.psacard.com/publicapi";

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
      const response = await fetch(`${PSA_API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          "Authorization": `bearer ${token}`,
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
  
  // Get card by cert number
  getCardByCertNumber: async (certNumber: string): Promise<PSACard> => {
    return psaService.callApi<PSACard>(`/cert/GetByCertNumber/${certNumber}`);
  },
  
  // Search for cards
  searchCards: async (params: PSASearchParams): Promise<{items: PSACard[], total: number}> => {
    // Create query string from params
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");
    
    return psaService.callApi<{items: PSACard[], total: number}>(`/cert/search?${queryParams}`);
  },
  
  // Mock function to simulate market data since the actual API doesn't provide this
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
