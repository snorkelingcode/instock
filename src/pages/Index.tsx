
import React, { useEffect, useState } from "react";
import { Hero } from "@/components/landing/Hero";
import { CardGrid } from "@/components/landing/CardGrid";
import { ProductService } from "@/services/ProductService";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();

  // Sample links provided by the user
  const sampleLinks = [
    "https://www.target.com/p/panini-squishmallows-trading-card-mega-box-series-1/-/A-93615552",
    "https://www.pokemoncenter.com/en-nz/product/181-85037/pokemon-tcg-sword-and-shield-astral-radiance-build-and-battle-box",
    "https://www.pokemoncenter.com/en-nz/product/290-85019/pokemon-tcg-morpeko-v-union-special-collection",
    "https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-obsidian-flames-3pk-booster-styles-may-vary/6546725.p?skuId=6546725",
    "https://www.bestbuy.com/site/pokemon-trading-card-game-charizard-ex-super-premium-collection/6590379.p?skuId=6590379",
    "https://www.bestbuy.com/site/pokemon-trading-card-game-mabosstiff-ex-box/6569192.p?skuId=6569192"
  ];

  useEffect(() => {
    // Load Inter font
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Initialize with sample links
    const initializeSampleLinks = async () => {
      setInitializing(true);
      
      try {
        // Add each link one by one
        for (const url of sampleLinks) {
          await ProductService.addProductLink(url);
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        toast({
          title: "Success",
          description: "Sample products initialized",
        });
      } catch (error) {
        console.error("Error initializing sample links:", error);
        toast({
          title: "Warning",
          description: "Some product links couldn't be added",
          variant: "destructive",
        });
      } finally {
        setInitializing(false);
      }
    };
    
    // Check if we should initialize (could add additional logic here to only do this once)
    initializeSampleLinks();

    return () => {
      document.head.removeChild(link);
    };
  }, [toast]);

  return (
    <main
      className="min-h-screen bg-[#D9D9D9] px-[86px] py-[65px] max-md:p-10 max-sm:p-5 font-['Inter']"
      role="main"
    >
      <Hero />
      
      {initializing && (
        <div className="mb-8 text-center">
          <div className="animate-pulse text-xl">Initializing product data...</div>
        </div>
      )}
      
      <CardGrid />
      <Toaster />
    </main>
  );
};

export default Index;
