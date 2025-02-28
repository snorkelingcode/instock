
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./Card";
import { ProductService, Product } from "@/services/ProductService";
import { useToast } from "@/hooks/use-toast";

export const CardGrid: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastCardRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const handleListingClick = (product: Product) => {
    if (product.url) {
      window.open(product.url, "_blank");
    }
  };

  const loadMoreItems = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, you would fetch more products with pagination
      // For now, we'll simulate by fetching all products each time
      const products = await ProductService.getProducts(items.length + 9);
      
      if (products.length > items.length) {
        setItems(products);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
      toast({
        title: "Error",
        description: "Failed to load more products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [items.length, loading, toast]);

  // Initial load
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const products = await ProductService.getProducts();
        setItems(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
          {row.map((product, index) => (
            <div 
              key={product.id} 
              ref={rowIndex === itemRows.length - 1 && index === row.length - 1 ? lastCardRef : null}
            >
              <Card 
                productLine={product.product_line || "Product Line"}
                product={product.product_name || "Product"}
                source={product.source || "Source"}
                inStock={product.in_stock}
                url={product.url}
                lastChecked={product.last_checked}
                onListingClick={() => handleListingClick(product)} 
              />
            </div>
          ))}
          {/* Fill empty spaces in the last row to maintain layout */}
          {rowIndex === itemRows.length - 1 && row.length < 3 && 
            Array(3 - row.length).fill(0).map((_, i) => (
              <Card key={`empty-${i}`} isPlaceholder={true} />
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
