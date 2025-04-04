import React, { useState, useEffect } from "react";
import { Card } from "./Card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import DiscoCardEffect from "@/components/ui/DiscoCardEffect";

interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  msrp?: number;
  listing_link: string;
  image_link?: string;
  in_stock?: boolean;
  last_seen_in_stock?: string;
}

const CardSkeleton = () => (
  <div className="w-full max-w-[340px] h-[480px] bg-white rounded-[10px] p-4 shadow-md">
    <Skeleton className="w-[140px] h-[140px] mx-auto mt-6 rounded-md" />
    <div className="px-[41px] py-[15px] space-y-4">
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
    </div>
    <Skeleton className="w-[257px] h-[50px] rounded-md mx-auto mt-6" />
  </div>
);

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
          .eq('in_stock', true)
          .order('id', { ascending: true });

        if (error) {
          throw error;
        }

        setTimeout(() => {
          setProducts(data || []);
          setLoading(false);
        }, 300);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const handleListingClick = (index: number) => {
    console.log(`Listing ${index + 1} clicked`);
  };

  const displayProducts = products.length > 0 ? products : Array.from({ length: 5 }, (_, i) => ({
    id: i,
    product_line: "Pokémon",
    product: "Charizard ex Super",
    source: "Target",
    price: 69.99,
    msrp: 79.99,
    listing_link: "",
    image_link: "",
    in_stock: true
  }));

  const itemsPerRow = 3;
  const itemRows = [];
  for (let i = 0; i < displayProducts.length; i += itemsPerRow) {
    itemRows.push(displayProducts.slice(i, i + itemsPerRow));
  }

  const skeletonRows = [];
  for (let i = 0; i < 2; i++) {
    const row = [];
    for (let j = 0; j < itemsPerRow; j++) {
      row.push(j);
    }
    skeletonRows.push(row);
  }

  return (
    <div 
      className="flex flex-col gap-6 mx-auto max-w-[1200px] px-4" 
      role="region" 
      aria-label="Product listings"
    >
      {loading ? (
        skeletonRows.map((row, rowIndex) => (
          <div 
            key={`skeleton-row-${rowIndex}`}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center w-full"
          >
            {row.map((_, idx) => (
              <CardSkeleton key={`skeleton-${rowIndex}-${idx}`} />
            ))}
          </div>
        ))
      ) : (
        itemRows.map((row, rowIndex) => (
          <div 
            key={`row-${rowIndex}`}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center w-full"
          >
            {row.map((product, idx) => {
              const cardIndex = rowIndex * itemsPerRow + idx;
              
              return (
                <div key={product.id} className="flex justify-center w-full">
                  <DiscoCardEffect index={cardIndex}>
                    <Card 
                      productLine={product.product_line}
                      product={product.product}
                      source={product.source}
                      price={product.price}
                      msrp={product.msrp}
                      listingLink={product.listing_link}
                      imageLink={product.image_link}
                      onListingClick={() => handleListingClick(product.id)}
                      index={cardIndex}
                      inStock={product.in_stock !== false}
                      lastSeenInStock={product.last_seen_in_stock}
                    />
                  </DiscoCardEffect>
                </div>
              );
            })}
            {rowIndex === itemRows.length - 1 && row.length < itemsPerRow && 
              Array(itemsPerRow - row.length).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="invisible" />
              ))
            }
          </div>
        ))
      )}
    </div>
  );
};
