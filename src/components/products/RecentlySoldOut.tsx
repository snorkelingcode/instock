
import React, { useState } from "react";
import { Card } from "@/components/landing/Card";
import { Skeleton } from "@/components/ui/skeleton";
import DiscoCardEffect from "@/components/ui/DiscoCardEffect";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerRow = 3;
  const rowsPerPage = 2;
  const itemsPerPage = itemsPerRow * rowsPerPage;
  
  // Calculate total pages
  const totalPages = Math.ceil(products.length / itemsPerPage);
  
  // Get current page items
  const currentItems = products.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  // Create rows from current items
  const itemRows = [];
  for (let i = 0; i < currentItems.length; i += itemsPerRow) {
    itemRows.push(currentItems.slice(i, i + itemsPerRow));
  }

  const skeletonRows = [];
  for (let i = 0; i < rowsPerPage; i++) {
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
  
  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };
  
  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
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
        <>
          {itemRows.map((row, rowIndex) => (
            <div 
              key={`row-${rowIndex}`}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center w-full"
            >
              {row.map((product, idx) => {
                const cardIndex = (currentPage * itemsPerPage) + (rowIndex * itemsPerRow) + idx;
                
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
          ))}
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentlySoldOut;
