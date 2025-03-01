
import React, { useState, useEffect } from "react";
import { Card } from "./Card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  listing_link: string;
}

export const CardGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use type assertion to bypass TypeScript error
        const { data, error } = await (supabase as any)
          .from('products')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          throw error;
        }

        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const handleListingClick = (index: number) => {
    console.log(`Listing ${index + 1} clicked`);
  };

  // Create fallback cards if no products are available
  const displayProducts = products.length > 0 ? products : Array.from({ length: 12 }, (_, i) => ({
    id: i,
    product_line: "Product Line",
    product: "Product",
    source: "Source",
    price: 0,
    listing_link: ""
  }));

  return (
    <div 
      className="flex flex-col" 
      role="region" 
      aria-label="Product listings"
    >
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-pulse text-xl">Loading products...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
          {displayProducts.map((product) => (
            <div key={product.id} className="h-full">
              <Card 
                productLine={product.product_line}
                product={product.product}
                source={product.source}
                price={product.price}
                listingLink={product.listing_link}
                onListingClick={() => handleListingClick(product.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
