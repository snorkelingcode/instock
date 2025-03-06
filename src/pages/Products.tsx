
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

const ProductsPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true })
          .limit(3);

        if (error) {
          throw error;
        }

        setFeaturedProducts(data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        toast({
          title: "Error",
          description: "Failed to load featured products",
          variant: "destructive",
        });
        
        setFeaturedProducts([
          {
            id: 1,
            product_line: "Scarlet & Violet",
            product: "Twilight Masquerade Booster Box",
            source: "Pokemon Center",
            price: 149.99,
            listing_link: "",
            image_link: "",
            in_stock: true
          },
          {
            id: 2,
            product_line: "Pokemon TCG",
            product: "Charizard ex Premium Collection",
            source: "Target",
            price: 39.99,
            listing_link: "",
            image_link: "",
            in_stock: false
          },
          {
            id: 3,
            product_line: "Paldean Fates",
            product: "Elite Trainer Box",
            source: "Walmart",
            price: 49.99,
            listing_link: "",
            image_link: "",
            in_stock: true
          }
        ]);
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
