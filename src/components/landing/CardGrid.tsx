
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./Card";

export const CardGrid: React.FC = () => {
  const [items, setItems] = useState<number[]>(Array.from({ length: 3 }, (_, i) => i));
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastCardRef = useRef<HTMLDivElement | null>(null);

  const handleListingClick = (index: number) => {
    console.log(`Listing ${index + 1} clicked`);
  };

  const loadMoreItems = useCallback(() => {
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      const currentLength = items.length;
      const newItems = Array.from(
        { length: 3 },
        (_, i) => currentLength + i
      );
      setItems((prevItems) => [...prevItems, ...newItems]);
      setLoading(false);
    }, 500);
  }, [items.length]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loading) {
        loadMoreItems();
      }
    }, options);

    if (lastCardRef.current) {
      observer.current.observe(lastCardRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadMoreItems, loading]);

  // Create groups of 3 items for grid rows
  const itemRows = [];
  for (let i = 0; i < items.length; i += 3) {
    itemRows.push(items.slice(i, i + 3));
  }

  return (
    <div 
      className="flex flex-col gap-8" 
      role="region" 
      aria-label="Product listings"
    >
      {itemRows.map((row, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="flex justify-between gap-[19px] max-md:flex-col max-md:items-center"
        >
          {row.map((index) => (
            <div 
              key={index} 
              ref={rowIndex === itemRows.length - 1 && index === row[row.length - 1] ? lastCardRef : null}
            >
              <Card onListingClick={() => handleListingClick(index)} />
            </div>
          ))}
          {/* Fill empty spaces in the last row to maintain layout */}
          {rowIndex === itemRows.length - 1 && row.length < 3 && 
            Array(3 - row.length).fill(0).map((_, i) => (
              <div key={`empty-${i}`} className="w-[340px] h-[295px] invisible max-md:hidden" />
            ))
          }
        </div>
      ))}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-pulse text-xl">Loading more products...</div>
        </div>
      )}
    </div>
  );
};
