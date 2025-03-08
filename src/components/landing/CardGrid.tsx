
import React, { useState, useEffect } from "react";
import { Card } from "./Card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  listing_link: string;
  image_link?: string;
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

        if (data) {
          // Cast the data to the Product type to ensure type compatibility
          const typedProducts: Product[] = data.map(item => ({
            id: item.id,
            product_line: item.product_line,
            product: item.product,
            source: item.source,
            price: item.price,
            listing_link: item.listing_link,
            image_link: item.image_link
          }));
          
          setProducts(typedProducts);
        }
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
  const displayProducts = products.length > 0 ? products : Array.from({ length: 5 }, (_, i) => ({
    id: i,
    product_line: "Pokémon",
    product: "Charizard ex Super",
    source: "Target",
    price: 69.99,
    listing_link: "",
    image_link: ""
  }));

  // Set 3 items per row for all pages
  const itemsPerRow = 3;
  const itemRows = [];
  for (let i = 0; i < displayProducts.length; i += itemsPerRow) {
    itemRows.push(displayProducts.slice(i, i + itemsPerRow));
  }

  return (
    <div 
      className="flex flex-col gap-8 mx-auto max-w-[1200px]" 
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
            className="flex justify-center gap-[19px] max-md:flex-col max-md:items-center w-full mx-auto"
          >
            {row.map((product, idx) => {
              // Calculate a unique index for each card based on its position
              const cardIndex = rowIndex * itemsPerRow + idx;
              
              return (
                <div key={product.id} className="w-full max-w-[340px]">
                  <Card 
                    productLine={product.product_line}
                    product={product.product}
                    source={product.source}
                    price={product.price}
                    listingLink={product.listing_link}
                    imageLink={product.image_link}
                    onListingClick={() => handleListingClick(product.id)}
                    index={cardIndex}
                  />
                </div>
              );
            })}
            {/* Fill empty spaces in the last row to maintain layout */}
            {rowIndex === itemRows.length - 1 && row.length < itemsPerRow && 
              Array(itemsPerRow - row.length).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="w-[340px] h-[440px] invisible max-md:hidden" />
              ))
            }
          </div>
        ))
      )}
    </div>
  );
};
