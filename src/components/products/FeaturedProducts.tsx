
import React from "react";
import { Card } from "@/components/landing/Card";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  listing_link: string;
  image_link?: string;
  in_stock?: boolean;
  featured?: boolean;
}

interface FeaturedProductsProps {
  products: Product[];
  loading: boolean;
  emptyMessage?: string;
}

const FeaturedProductSkeleton = () => (
  <div className="flex flex-col space-y-3 p-4 w-full bg-white rounded-lg shadow-md">
    <Skeleton className="h-[140px] w-[140px] rounded-md mx-auto" />
    <Skeleton className="h-5 w-4/5" />
    <Skeleton className="h-5 w-3/5" />
    <Skeleton className="h-5 w-2/5" />
    <Skeleton className="h-5 w-3/5" />
    <Skeleton className="h-10 w-2/3 mx-auto mt-4" />
  </div>
);

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ 
  products, 
  loading,
  emptyMessage = "No featured products found. Please check back later for updates."
}) => {
  // Only render the component when we have products or are loading
  if (!loading && products.length === 0) {
    return null;
  }
  
  // Always render something - either skeletons or products
  const renderProducts = () => {
    if (loading) {
      return (
        <>
          {[...Array(3)].map((_, index) => (
            <div key={`skeleton-${index}`} className="flex justify-center">
              <FeaturedProductSkeleton />
            </div>
          ))}
        </>
      );
    }
    
    return (
      <>
        {products.map((product, index) => (
          <div key={product.id} className="flex justify-center">
            <Card 
              productLine={product.product_line}
              product={product.product}
              source={product.source}
              price={product.price}
              listingLink={product.listing_link}
              imageLink={product.image_link}
              index={index}
            />
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {renderProducts()}
    </div>
  );
};

export default FeaturedProducts;
