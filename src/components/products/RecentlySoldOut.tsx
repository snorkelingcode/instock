
import React from "react";
import { Card } from "@/components/landing/Card";
import { Skeleton } from "@/components/ui/skeleton";
import DiscoCardEffect from "@/components/ui/DiscoCardEffect";
import { format, parseISO, isValid } from "date-fns";

interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  listing_link: string;
  image_link?: string;
  last_seen_in_stock?: string;
}

interface RecentlySoldOutProps {
  products: Product[];
  loading: boolean;
}

const SoldOutCardSkeleton = () => (
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

const RecentlySoldOut: React.FC<RecentlySoldOutProps> = ({ products, loading }) => {
  const itemsPerRow = 3;
  const itemRows = [];
  
  for (let i = 0; i < products.length; i += itemsPerRow) {
    itemRows.push(products.slice(i, i + itemsPerRow));
  }

  const skeletonRows = [];
  for (let i = 0; i < 1; i++) {  // Just one row of skeletons
    const row = [];
    for (let j = 0; j < itemsPerRow; j++) {
      row.push(j);
    }
    skeletonRows.push(row);
  }

  const formatLastSeenDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid date";
      return `${format(date, "MMM d, yyyy")}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div 
      className="flex flex-col gap-6 mx-auto max-w-[1200px] px-4" 
      role="region" 
      aria-label="Recently Sold Out"
    >
      {loading ? (
        skeletonRows.map((row, rowIndex) => (
          <div 
            key={`skeleton-row-${rowIndex}`}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center w-full"
          >
            {row.map((_, idx) => (
              <SoldOutCardSkeleton key={`skeleton-${rowIndex}-${idx}`} />
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
                      listingLink={product.listing_link}
                      imageLink={product.image_link}
                      index={cardIndex}
                      inStock={false}
                      lastSeenInStock={formatLastSeenDate(product.last_seen_in_stock)}
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

export default RecentlySoldOut;
