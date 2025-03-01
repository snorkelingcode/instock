
import React, { useState, useEffect, useRef, useCallback } from "react";
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
        const { data, error } = await supabase
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
  const displayProducts = products.length > 0 ? products : Array.from({ length: 3 }, (_, i) => ({
    id: i,
    product_line: "Product Line",
    product: "Product",
    source: "Source",
    price: 0,
    listing_link: ""
  }));

  // Create groups of 3 items for grid rows
  const itemRows = [];
  for (let i = 0; i < displayProducts.length; i += 3) {
    itemRows.push(displayProducts.slice(i, i + 3));
  }

  return (
    <div 
      className="flex flex-col gap-8" 
      role="region" 
      aria-label="Product listings"
    >
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-pulse text-xl">Loading products...</div>
        </div>
      ) : (
        itemRows.map((row, rowIndex) => (
          <div 
            key={`row-${rowIndex}`}
            className="flex justify-between gap-[19px] max-md:flex-col max-md:items-center"
          >
            {row.map((product) => (
              <div key={product.id}>
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
            {/* Fill empty spaces in the last row to maintain layout */}
            {rowIndex === itemRows.length - 1 && row.length < 3 && 
              Array(3 - row.length).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="w-[340px] h-[295px] invisible max-md:hidden" />
              ))
            }
          </div>
        ))
      )}
    </div>
  );
};
