
import React from "react";
import { Card } from "@/components/landing/Card";
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
  featured?: boolean;
  last_seen_in_stock?: string;
}

interface FeaturedProductsProps {
  products: Product[];
  loading: boolean;
  emptyMessage?: string;
}

const FeaturedProductSkeleton = () => (
  <div className="flex flex-col space-y-3 p-4 w-full bg-white shadow-md rounded-lg">
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
  if (!loading && products.length === 0) {
    return null;
  }
  
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
          <div key={product.id} className="flex justify-center w-full">
            <DiscoCardEffect index={index}>
              <Card 
                productLine={product.product_line}
                product={product.product}
                source={product.source}
                price={product.price}
                msrp={product.msrp}
                listingLink={product.listing_link}
                imageLink={product.image_link}
                inStock={product.in_stock !== false}
                index={index}
                lastSeenInStock={product.last_seen_in_stock}
              />
            </DiscoCardEffect>
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
