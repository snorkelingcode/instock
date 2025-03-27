
import { toast } from "@/hooks/use-toast";

// PSA API proxy URL (using Supabase Edge Function)
const PSA_PROXY_URL = "https://etgkuasmqjidwtaxrfww.supabase.co/functions/v1/psa-proxy";

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
    return localStorage.getItem("psa_access_token") || "";
  },
  
  // Save access token to localStorage
  setToken: (token: string) => {
    localStorage.setItem("psa_access_token", token);
  },
  
  // Generic function to make API calls to PSA via our edge function
  callApi: async <T>(endpoint: string, method: string = "GET", body?: any): Promise<T> => {
    const token = psaService.getToken();
    
    try {
      console.log(`Calling PSA API via edge function: ${PSA_PROXY_URL}${endpoint}`);
      
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
      
      // Only add the token if it exists
      if (token) {
        headers["psa-token"] = token;
      }
      
      const response = await fetch(`${PSA_PROXY_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error("PSA API call failed:", error);
      
      if (error instanceof DOMException && error.name === "AbortError") {
        toast({
          title: "Request Timeout",
          description: "The API request timed out. Please try again later.",
          variant: "destructive"
        });
        throw new Error("Request timed out");
      }
      
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
    try {
      return await psaService.callApi<PSACard>(`/cert/${certNumber}`);
    } catch (error) {
      console.error(`Error getting card by cert number ${certNumber}:`, error);
      
      // Generate a mock card with the requested cert number
      const mockCard = psaService.generateMockCard(certNumber);
      console.log(`Using mock data for cert number ${certNumber}`, mockCard);
      return mockCard;
    }
  },
  
  // Search for cards
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
    
    try {
      return await psaService.callApi<{items: PSACard[], total: number}>(`/cert/items?${queryParams}`);
    } catch (error) {
      console.error(`Error searching cards with params ${JSON.stringify(params)}:`, error);
      console.log("Using mock data for search", params);
      
      // Fall back to mock data
      return psaService.getMockCardsByCategory(params.sport || "Pokemon", params.page || 1, params.pageSize || 20);
    }
  },
  
  // Search cards by category
  searchCardsByCategory: async (category: string, page: number = 1, pageSize: number = 20): Promise<{items: PSACard[], total: number}> => {
    console.log(`Searching cards for category: ${category}, page: ${page}, pageSize: ${pageSize}`);
    
    try {
      const result = await psaService.searchCards({
        sport: category,
        page,
        pageSize
      });
      
      console.log(`Found ${result.items.length} cards for ${category}`);
      return result;
    } catch (error) {
      console.error(`Error searching cards for category ${category}:`, error);
      console.log(`Using mock data for category ${category}`);
      
      // Fall back to mock data
      return psaService.getMockCardsByCategory(category, page, pageSize);
    }
  },
  
  // Generate a single mock card
  generateMockCard: (certNumber?: string): PSACard => {
    const randomId = Math.floor(Math.random() * 10000);
    return {
      certNumber: certNumber || `${10000000 + randomId}`,
      certDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      grade: String(Math.floor(Math.random() * 5) + 6),
      description: `Mock Card #${randomId}`,
      cardInfo: {
        brand: "Pokemon TCG",
        year: String(2000 + Math.floor(Math.random() * 23)),
        sport: "Pokemon",
        cardNumber: String(randomId),
        playerName: `Character ${randomId}`
      },
      popReport: {
        totalPop: Math.floor(Math.random() * 1000) + 10,
        popHigher: Math.floor(Math.random() * 100),
        popSame: Math.floor(Math.random() * 500),
        popLower: Math.floor(Math.random() * 200)
      },
      marketData: {
        lastSalePrice: Math.round(Math.random() * 10000) / 100,
        lastSaleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        averagePrice: Math.round(Math.random() * 12000) / 100,
        marketCap: Math.round(Math.random() * 1000000) / 100,
        volume: Math.round(Math.random() * 100)
      }
    };
  },
  
  // Get mock cards by category as a fallback when the API fails
  getMockCardsByCategory: async (category: string, page: number = 1, pageSize: number = 20): Promise<{items: PSACard[], total: number}> => {
    // Generate realistic mock cards based on the category
    const mockCards: PSACard[] = Array.from({ length: pageSize }, (_, i) => ({
      certNumber: `${10000000 + (page-1)*pageSize + i}`,
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
        cardNumber: String((page-1)*pageSize + i + 1),
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
    
    console.log(`Generated ${mockCardsWithMarketData.length} mock cards for ${category}`);
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
