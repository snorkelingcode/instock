
import React from "react";
import { Card as ProductCard } from "@/components/landing/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isValid, parseISO } from "date-fns";

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
  // Set 3 items per row for all pages
  const itemsPerRow = 3;
  const itemRows = [];
  
  for (let i = 0; i < products.length; i += itemsPerRow) {
    itemRows.push(products.slice(i, i + itemsPerRow));
  }

  // Create skeleton layout for loading state
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
      className="flex flex-col gap-8 mx-auto max-w-[1200px]" 
      role="region" 
      aria-label="Recently Sold Out"
    >
      {loading ? (
        // Show skeleton UI while loading
        skeletonRows.map((row, rowIndex) => (
          <div 
            key={`skeleton-row-${rowIndex}`}
            className="flex justify-center gap-[19px] max-md:flex-col max-md:items-center w-full mx-auto"
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
            className="flex justify-center gap-[19px] max-md:flex-col max-md:items-center w-full mx-auto"
          >
            {row.map((product, idx) => {
              // Calculate a unique index for each card based on its position
              const cardIndex = rowIndex * itemsPerRow + idx;
              
              return (
                <div key={product.id} className="w-full max-w-[340px]">
                  <ProductCard 
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

export default RecentlySoldOut;
