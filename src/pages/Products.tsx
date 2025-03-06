import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation/Navigation";
import Footer from "@/components/layout/Footer";
import { CardGrid } from "@/components/landing/CardGrid";
import FeaturedProducts from "@/components/products/FeaturedProducts";
import AboutSection from "@/components/products/AboutSection";

// Interface for product data
interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  listing_link: string;
  image_link?: string;
  in_stock?: boolean;
}

// Key for localStorage
const FEATURED_PRODUCTS_KEY = 'featuredProducts';
const FEATURED_PRODUCTS_TIMESTAMP_KEY = 'featuredProductsTimestamp';
// Cache duration in milliseconds (e.g., 24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const ProductsPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        
        // Check if we have cached featured products
        const cachedProducts = localStorage.getItem(FEATURED_PRODUCTS_KEY);
        const cachedTimestamp = localStorage.getItem(FEATURED_PRODUCTS_TIMESTAMP_KEY);
        
        // If we have cached products and they're not expired, use them
        if (cachedProducts && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          
          if (now - timestamp < CACHE_DURATION) {
            setFeaturedProducts(JSON.parse(cachedProducts));
            setLoading(false);
            return;
          }
        }
        
        // Get Pokémon products only
        const { data: pokemonProducts, error: pokemonError } = await supabase
          .from('products')
          .select('*')
          .or('product_line.ilike.%pokemon%,product.ilike.%pokemon%');
          
        if (pokemonError) {
          throw pokemonError;
        }
        
        // If there are Pokémon products, get 3 random ones
        if (pokemonProducts && pokemonProducts.length > 0) {
          // Generate 3 random unique indices
          const totalProducts = pokemonProducts.length;
          const randomIndices = new Set<number>();
          
          // Make sure we don't try to get more products than exist
          const numToFetch = Math.min(3, totalProducts);
          
          while (randomIndices.size < numToFetch) {
            const randomIndex = Math.floor(Math.random() * totalProducts);
            randomIndices.add(randomIndex);
          }
          
          // Get the randomly selected products
          const selectedProducts = Array.from(randomIndices).map(index => pokemonProducts[index]);
          
          // Save to state and cache
          setFeaturedProducts(selectedProducts);
          localStorage.setItem(FEATURED_PRODUCTS_KEY, JSON.stringify(selectedProducts));
          localStorage.setItem(FEATURED_PRODUCTS_TIMESTAMP_KEY, Date.now().toString());
        } else {
          throw new Error('No Pokémon products found');
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        toast({
          title: "Error",
          description: "Failed to load featured Pokémon products",
          variant: "destructive",
        });
        
        // Fallback featured products (all Pokémon-related)
        const fallbackProducts = [
          {
            id: 1,
            product_line: "Pokémon TCG",
            product: "Scarlet & Violet - Twilight Masquerade Booster Box",
            source: "Pokémon Center",
            price: 149.99,
            listing_link: "",
            image_link: "",
            in_stock: true
          },
          {
            id: 2,
            product_line: "Pokémon TCG",
            product: "Charizard ex Premium Collection",
            source: "Target",
            price: 39.99,
            listing_link: "",
            image_link: "",
            in_stock: false
          },
          {
            id: 3,
            product_line: "Pokémon TCG",
            product: "Paldean Fates Elite Trainer Box",
            source: "Walmart",
            price: 49.99,
            listing_link: "",
            image_link: "",
            in_stock: true
          }
        ];
        
        setFeaturedProducts(fallbackProducts);
        // Even on error, cache the fallback products to avoid repeated errors
        localStorage.setItem(FEATURED_PRODUCTS_KEY, JSON.stringify(fallbackProducts));
        localStorage.setItem(FEATURED_PRODUCTS_TIMESTAMP_KEY, Date.now().toString());
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        {/* Main content */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-2xl font-bold mb-2">TCG Products</h1>
          <p className="text-gray-700 mb-6">
            Find all TCG products with real-time stock information from major retailers. We track booster boxes, elite trainer boxes, special collections, and more.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
          <FeaturedProducts products={featuredProducts} loading={loading} />
          
          <h2 className="text-xl font-semibold mb-4 mt-12">All Products</h2>
          <p className="text-gray-700 mb-6">
            Below are all TCG products currently tracked. Products shown as in-stock have been verified within the last 15 minutes.
          </p>
          
          <CardGrid />
          
          <div className="mt-8 flex justify-center">
            {/* Pagination or load more button could go here */}
          </div>
        </div>
        
        <AboutSection />
        
        <Footer />
      </div>
    </div>
  );
};

export default ProductsPage;
