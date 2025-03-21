import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { CardGrid } from "@/components/landing/CardGrid";
import FeaturedProducts from "@/components/products/FeaturedProducts";
import AboutSection from "@/components/products/AboutSection";
import { setCache, getCache, getTotalCacheSize, getPartitionInfo } from "@/utils/cacheUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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
// Cache duration in milliseconds (e.g., 24 hours)
const CACHE_DURATION_MINUTES = 24 * 60;

const ProductsPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<JobStatus[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      await fetchFeaturedProducts();
      await fetchActiveJobs();
    };
    
    fetchData();
    
    // Setup interval to refresh active jobs
    const refreshInterval = setInterval(async () => {
      const partitionInfo = getPartitionInfo(PRODUCTS_PARTITION);
      setCacheInfo(partitionInfo);
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
      
      // If we have cached products, use them
      if (cachedProducts) {
        setFeaturedProducts(cachedProducts);
        setLoading(false);
        
        // Update cache info
        const partitionInfo = getPartitionInfo(PRODUCTS_PARTITION);
        setCacheInfo(partitionInfo);
        
        return;
      }
      
      // Query products marked as featured
      const { data: featuredData, error: featuredError } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(3);
        
      if (featuredError) {
        throw featuredError;
      }
      
      // If we have enough featured products, use them
      if (featuredData && featuredData.length > 0) {
        // Type-safe conversion to Product array
        const typedFeatured = featuredData as Product[];
        setFeaturedProducts(typedFeatured);
        setCache(FEATURED_PRODUCTS_KEY, typedFeatured, CACHE_DURATION_MINUTES, PRODUCTS_PARTITION);
        
        // Update cache info
        const partitionInfo = getPartitionInfo(PRODUCTS_PARTITION);
        setCacheInfo(partitionInfo);
        setLoading(false);
        return;
      }
      
      // If no featured products, get random products
      const { data: randomProducts, error: randomError } = await supabase
        .from('products')
        .select('*')
        .limit(3);
        
      if (randomError) {
        throw randomError;
      }
      
      if (randomProducts && randomProducts.length > 0) {
        const typedRandomProducts = randomProducts as Product[];
        setFeaturedProducts(typedRandomProducts);
        setCache(FEATURED_PRODUCTS_KEY, typedRandomProducts, CACHE_DURATION_MINUTES, PRODUCTS_PARTITION);
        
        // Update cache info
        const partitionInfo = getPartitionInfo(PRODUCTS_PARTITION);
        setCacheInfo(partitionInfo);
      } else {
        throw new Error('No products found');
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast({
        title: "Error",
        description: "Failed to load featured products",
        variant: "destructive",
      });
      
      // Fallback featured products
      const fallbackProducts: Product[] = [
        {
          id: 1,
          product_line: "Pokémon TCG",
          product: "Scarlet & Violet - Twilight Masquerade Booster Box",
          source: "Pokémon Center",
          price: 149.99,
          listing_link: "",
          image_link: "",
          in_stock: true,
          featured: true
        },
        {
          id: 2,
          product_line: "Pokémon TCG",
          product: "Charizard ex Premium Collection",
          source: "Target",
          price: 39.99,
          listing_link: "",
          image_link: "",
          in_stock: false,
          featured: true
        },
        {
          id: 3,
          product_line: "Pokémon TCG",
          product: "Paldean Fates Elite Trainer Box",
          source: "Walmart",
          price: 49.99,
          listing_link: "",
          image_link: "",
          in_stock: true,
          featured: true
        }
      ];
      
      setFeaturedProducts(fallbackProducts);
      // Even on error, cache the fallback products to avoid repeated errors
      setCache(FEATURED_PRODUCTS_KEY, fallbackProducts, CACHE_DURATION_MINUTES, PRODUCTS_PARTITION);
      
      // Update cache info
      const partitionInfo = getPartitionInfo(PRODUCTS_PARTITION);
      setCacheInfo(partitionInfo);
    } finally {
      setLoading(false);
    }
  };
  
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
    </Layout>
  );
};

export default ProductsPage;
