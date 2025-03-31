
import { toast } from "@/hooks/use-toast";
import { marketDataService } from "@/services/marketDataService";

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
    details?: {
      pop10?: number;
      pop9?: number;
      pop8?: number;
      pop7?: number;
      pop6?: number;
      pop5?: number;
      pop4?: number;
      pop3?: number;
      pop2?: number;
      pop1?: number;
      popA?: number;
    };
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
  set?: string;
  franchise?: string;
}

// Service for PSA API calls
export const psaService = {
  // Get access token from localStorage
  getToken: () => {
    const token = localStorage.getItem("psa_access_token") || "";
    console.log("Retrieved token from localStorage:", token ? "Token exists" : "No token found");
    return token;
  },
  
  // Save access token to localStorage
  setToken: (token: string) => {
    console.log("Saving token to localStorage");
    localStorage.setItem("psa_access_token", token);
  },
  
  // Direct call to PSA API (without proxy, for testing purposes)
  callPsaApiDirect: async <T>(endpoint: string, method: string = "GET", body?: any): Promise<T> => {
    const token = psaService.getToken();
    
    if (!token) {
      throw new Error("PSA API token is not set");
    }
    
    try {
      console.log(`Calling PSA API directly: https://api.psacard.com/publicapi${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `bearer ${token}`
      };
      
      const response = await fetch(`https://api.psacard.com/publicapi${endpoint}`, {
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
      console.error("PSA API direct call failed:", error);
      
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
  
  // Generic function to make API calls to PSA via our edge function
  callApi: async <T>(endpoint: string, method: string = "GET", body?: any): Promise<T> => {
    const token = psaService.getToken();
    
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "PSA API token is not set. Please set a token in your account settings.",
        variant: "destructive"
      });
      throw new Error("PSA API token is not set");
    }
    
    try {
      console.log(`Calling PSA API via edge function: ${PSA_PROXY_URL}${endpoint}`);
      console.log("Using PSA token:", token.substring(0, 5) + "..." + token.substring(token.length - 5));
      
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "psa-token": token
      };
      
      console.log("Sending request with headers:", headers);
      
      const response = await fetch(`${PSA_PROXY_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response received with status ${response.status}`);
      
      if (!response.ok) {
        console.error(`PSA API error: ${response.status}`);
        
        let errorMessage = `API returned ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error("Error data:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error response, just use the status code
          console.error("Could not parse error response");
        }
        
        if (response.status === 401) {
          // Clear the invalid token from localStorage
          localStorage.removeItem("psa_access_token");
          
          toast({
            title: "Authentication Failed",
            description: "Your PSA API token is invalid or expired. Please update your token in the settings.",
            variant: "destructive"
          });
          throw new Error("Authentication failed. Please check your PSA API token.");
        }
        
        throw new Error(errorMessage);
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
      
      // Only show toast if it's not an auth error (we already showed one for that)
      if (!error.message?.includes("Authentication failed")) {
        toast({
          title: "API Error",
          description: error instanceof Error ? error.message : "Failed to fetch data from PSA",
          variant: "destructive"
        });
      }
      
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
      language: params.language || "English"
    };
    
    // Filter out undefined, null, and empty string values
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams)
        .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    );
    
    // Create query string from filtered params
    const queryParams = Object.entries(filteredParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");
    
    try {
      return await psaService.callApi<{items: PSACard[], total: number}>(`/cert/items?${queryParams}`);
    } catch (error) {
      console.error(`Error searching cards with params ${JSON.stringify(params)}:`, error);
      console.log("Using mock data for search", params);
      
      // Fall back to mock data
      return psaService.getMockCardsByCategory(params.sport || params.franchise || "Pokemon", params.page || 1, params.pageSize || 20);
    }
  },
  
  // Search cards by category
  searchCardsByCategory: async (category: string, page: number = 1, pageSize: number = 20, filters?: PSASearchParams): Promise<{items: PSACard[], total: number}> => {
    console.log(`Searching cards for category: ${category}, page: ${page}, pageSize: ${pageSize}, filters:`, filters);
    
    try {
      const result = await psaService.searchCards({
        sport: category,
        page,
        pageSize,
        ...filters
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
  
  // Test direct PSA API call
  testPsaApiConnection: async (): Promise<boolean> => {
    try {
      const response = await psaService.callPsaApiDirect<any>("/cert/GetByCertNumber/00000001");
      console.log("PSA API connection test result:", response);
      return true;
    } catch (error) {
      console.error("PSA API connection test failed:", error);
      return false;
    }
  },
  
  // Update card data from PSA API
  updateCardPopulationFromPSA: async (card: any): Promise<boolean> => {
    try {
      let certNumber = card.certification_number;
      
      if (!certNumber) {
        const certMatch = card.card_name.match(/PSA\s*#?\s*(\d+)/i);
        if (certMatch && certMatch[1]) {
          certNumber = certMatch[1];
          console.log(`Found cert number ${certNumber} in card name`);
        } else {
          throw new Error("No certification number found for card");
        }
      }
      
      console.log(`Updating population data for cert ${certNumber}`);
      
      const psaData = await psaService.callApi<any>(`/cert/${certNumber}`);
      
      if (!psaData || !psaData.PSACert) {
        throw new Error("No data returned from PSA API");
      }
      
      console.log("PSA data received:", psaData);
      
      // Get the population data
      const popReport = psaData.popReport || {};
      const popDetails = popReport.details || {};
      
      // Update the card data
      const updatedCard = {
        ...card,
        certification_number: certNumber,
        population_10: popDetails.pop10 || 0,
        population_9: popDetails.pop9 || 0,
        population_8: popDetails.pop8 || 0,
        population_7: popDetails.pop7 || 0,
        population_6: popDetails.pop6 || 0,
        population_5: popDetails.pop5 || 0,
        population_4: popDetails.pop4 || 0,
        population_3: popDetails.pop3 || 0,
        population_2: popDetails.pop2 || 0,
        population_1: popDetails.pop1 || 0,
        population_auth: popDetails.popA || 0,
        total_population: psaData.PSACert.TotalPopulation || 0
      };
      
      // Save the updated card to the database
      if (card.id) {
        const result = await marketDataService.updateMarketData(card.id, updatedCard);
        
        if (result) {
          toast({
            title: "Success",
            description: "Card population data has been updated from PSA",
          });
          
          return true;
        } else {
          throw new Error("Failed to save updated card data");
        }
      } else {
        throw new Error("Card ID is missing");
      }
    } catch (error) {
      console.error("Error updating card population data:", error);
      
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update card data from PSA",
        variant: "destructive"
      });
      
      return false;
    }
  },
  
  // Batch update multiple cards
  batchUpdateCardsFromPSA: async (cards: any[], progressCallback?: (current: number, total: number) => void): Promise<{ success: number, failed: number }> => {
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < cards.length; i++) {
      try {
        const success = await psaService.updateCardPopulationFromPSA(cards[i]);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Error updating card ${i}:`, error);
        failedCount++;
      }
      
      // Report progress if callback provided
      if (progressCallback) {
        progressCallback(i + 1, cards.length);
      }
      
      // Add a small delay to avoid rate limiting
      if (i < cards.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return { success: successCount, failed: failedCount };
  },
  
  // Helper function to extract PSA cert number from card name
  extractCertNumber: (cardName: string): string | null => {
    const certMatch = cardName.match(/PSA\s*#?\s*(\d+)/i);
    if (certMatch && certMatch[1]) {
      return certMatch[1];
    }
    return null;
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
        popLower: Math.floor(Math.random() * 200),
        details: {
          pop10: Math.floor(Math.random() * 100),
          pop9: Math.floor(Math.random() * 200),
          pop8: Math.floor(Math.random() * 200),
          pop7: Math.floor(Math.random() * 150),
          pop6: Math.floor(Math.random() * 100),
          pop5: Math.floor(Math.random() * 50),
          pop4: Math.floor(Math.random() * 30),
          pop3: Math.floor(Math.random() * 20),
          pop2: Math.floor(Math.random() * 10),
          pop1: Math.floor(Math.random() * 5),
          popA: Math.floor(Math.random() * 20)
        }
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
        popLower: Math.floor(Math.random() * 200),
        details: {
          pop10: Math.floor(Math.random() * 100),
          pop9: Math.floor(Math.random() * 200),
          pop8: Math.floor(Math.random() * 200),
          pop7: Math.floor(Math.random() * 150),
          pop6: Math.floor(Math.random() * 100),
          pop5: Math.floor(Math.random() * 50),
          pop4: Math.floor(Math.random() * 30),
          pop3: Math.floor(Math.random() * 20),
          pop2: Math.floor(Math.random() * 10),
          pop1: Math.floor(Math.random() * 5),
          popA: Math.floor(Math.random() * 20)
        }
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
