import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { CardGrid } from "@/components/landing/CardGrid";
import FeaturedProducts from "@/components/products/FeaturedProducts";
import ProductsPageSummary from "@/components/products/ProductsPageSummary";
import RecentlySoldOut from "@/components/products/RecentlySoldOut";
import { setCache, getCache } from "@/utils/cacheUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useMetaTags } from "@/hooks/use-meta-tags";

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
  featured?: boolean;
  last_seen_in_stock?: string;
}

// Job status interface
interface JobStatus {
  id: string;
  job_id: string;
  source: string;
  status: 'pending' | 'fetching_data' | 'processing_data' | 'saving_to_database' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  completed_items: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error: string | null;
}

// Partition and cache keys
const PRODUCTS_PARTITION = "products";
const FEATURED_PRODUCTS_KEY = 'featuredProducts';
const RECENTLY_SOLD_OUT_KEY = 'recentlySoldOutProducts';
// Cache duration in milliseconds (e.g., 24 hours)
const CACHE_DURATION_MINUTES = 24 * 60;

const ProductsPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentlySoldOut, setRecentlySoldOut] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [soldOutLoading, setSoldOutLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState<JobStatus[]>([]);
  const { toast } = useToast();
  
  // Set meta tags for SEO
  useMetaTags({
    title: "TCG Products Tracker | In-Stock Trading Card Game Products",
    description: "Track TCG product availability across major retailers. Find in-stock Pokémon, Magic, Yu-Gi-Oh and other trading card game products, booster boxes, and elite trainer boxes.",
    keywords: "TCG products, Pokémon cards in stock, trading card games, booster boxes, elite trainer boxes, TCG tracker",
    ogTitle: "TCG Products Tracker | Find In-Stock Trading Card Game Products",
    ogDescription: "Real-time tracking of TCG product availability from Pokemon Center, Target, Walmart, Best Buy, GameStop and more.",
    canonicalUrl: "https://tcgupdates.com/products",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "TCG Products Tracker",
      "description": "Track trading card game product availability across major retailers",
      "url": "https://tcgupdates.com/products",
      "isPartOf": {
        "@type": "WebSite",
        "name": "TCG Updates",
        "url": "https://tcgupdates.com"
      }
    }
  });
  
  useEffect(() => {
    const fetchData = async () => {
      await fetchFeaturedProducts();
      await fetchRecentlySoldOut();
      await fetchActiveJobs();
    };
    
    fetchData();
    
    // Setup interval to refresh active jobs
    const refreshInterval = setInterval(async () => {
      await fetchActiveJobs();
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  const fetchActiveJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_job_status')
        .select('*')
        .not('status', 'in', '("completed","failed")');

      if (error) {
        console.error('Error fetching active jobs:', error);
        return;
      }

      // Safely cast the data to JobStatus[]
      setActiveJobs(data as JobStatus[]);
    } catch (error) {
      console.error('Error in fetchActiveJobs:', error);
    }
  };
  
  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      
      // Check if we have cached featured products
      const cachedProducts = getCache<Product[]>(FEATURED_PRODUCTS_KEY, PRODUCTS_PARTITION);
      
      // If we have cached products, use them but still fetch fresh data in the background
      if (cachedProducts) {
        console.log("Using cached featured products:", cachedProducts);
        setFeaturedProducts(cachedProducts);
        setLoading(false);
      }
      
      // Always fetch fresh data from the database
      console.log("Fetching fresh featured products data");
      const { data: featuredData, error: featuredError } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(3);
        
      if (featuredError) {
        throw featuredError;
      }
      
      // Update state and cache with fresh data
      if (featuredData) {
        console.log("Fresh featured products:", featuredData);
        // Type-safe conversion to Product array
        const typedFeatured = featuredData as Product[];
        setFeaturedProducts(typedFeatured);
        setCache(FEATURED_PRODUCTS_KEY, typedFeatured, CACHE_DURATION_MINUTES, PRODUCTS_PARTITION);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast({
        title: "Error",
        description: "Failed to load featured products",
        variant: "destructive",
      });
      
      // Leave previous state on error
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecentlySoldOut = async () => {
    try {
      setSoldOutLoading(true);
      
      // Check if we have cached recently sold out products
      const cachedProducts = getCache<Product[]>(RECENTLY_SOLD_OUT_KEY, PRODUCTS_PARTITION);
      
      // If we have cached products, use them but still fetch fresh data in the background
      if (cachedProducts) {
        console.log("Using cached recently sold out products:", cachedProducts);
        setRecentlySoldOut(cachedProducts);
        setSoldOutLoading(false);
      }
      
      // Always fetch fresh data from the database - only get products that have last_seen_in_stock value
      console.log("Fetching fresh recently sold out products data");
      const { data: soldOutData, error: soldOutError } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', false)
        .not('last_seen_in_stock', 'is', null)
        .order('last_seen_in_stock', { ascending: false });
        
      if (soldOutError) {
        throw soldOutError;
      }
      
      // Update state and cache with fresh data
      if (soldOutData) {
        console.log("Fresh recently sold out products:", soldOutData);
        // Type-safe conversion to Product array
        const typedSoldOut = soldOutData as Product[];
        setRecentlySoldOut(typedSoldOut);
        setCache(RECENTLY_SOLD_OUT_KEY, typedSoldOut, CACHE_DURATION_MINUTES, PRODUCTS_PARTITION);
      }
    } catch (error) {
      console.error('Error fetching recently sold out products:', error);
      toast({
        title: "Error",
        description: "Failed to load recently sold out products",
        variant: "destructive",
      });
      
      // Leave previous state on error
    } finally {
      setSoldOutLoading(false);
    }
  };
  
  // Check if there are featured products to show
  const hasFeaturedProducts = !loading && featuredProducts.length > 0;
  const hasRecentlySoldOut = !soldOutLoading && recentlySoldOut.length > 0;
  
  return (
    <Layout>
      {/* Main content */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        {activeJobs.length > 0 && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Data Sync in Progress</AlertTitle>
            <AlertDescription className="text-blue-700">
              There {activeJobs.length === 1 ? 'is' : 'are'} currently {activeJobs.length} active background {activeJobs.length === 1 ? 'job' : 'jobs'} running.
              New TCG data is being synchronized in the background. This process runs automatically and may take a few minutes to complete.
            </AlertDescription>
          </Alert>
        )}
        
        <h1 className="text-2xl font-bold mb-2">TCG Products</h1>
        <p className="text-gray-700 mb-6">
          Find all TCG products in stock. We track booster boxes, elite trainer boxes, special collections, and more.
        </p>
        
        {hasFeaturedProducts && (
          <>
            <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
            <FeaturedProducts products={featuredProducts} loading={loading} />
          </>
        )}
        
        <h2 className="text-xl font-semibold mb-4 mt-12">All Products</h2>
        <p className="text-gray-700 mb-6">
          View all available TCG products.
        </p>
        
        <CardGrid />
        
        {hasRecentlySoldOut && (
          <>
            <h2 className="text-xl font-semibold mb-4 mt-12">Recently Sold Out</h2>
            <p className="text-gray-700 mb-6">
              These products were recently in stock but are now sold out. Check back later or sign up for notifications.
            </p>
            <RecentlySoldOut products={recentlySoldOut} loading={soldOutLoading} />
          </>
        )}
        
        <div className="mt-8 flex justify-center">
          {/* Pagination or load more button could go here */}
        </div>
      </div>
      
      <ProductsPageSummary />
    </Layout>
  );
};

export default ProductsPage;
