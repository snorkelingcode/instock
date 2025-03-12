
import React from "react";
import FeaturedProduct from "@/components/featured-product";
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
}

interface FeaturedProductsProps {
  products: Product[];
  loading: boolean;
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

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, loading }) => {
  // Always render something - either skeletons or products
  const renderProducts = () => {
    if (loading || products.length === 0) {
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
            <FeaturedProduct 
              title={`${product.product_line} ${product.product}`}
              description={`${product.product_line} ${product.product} available at ${product.source}`}
              price={product.price}
              retailer={product.source}
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
