
import React from "react";
import FeaturedProduct from "@/components/featured-product";

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

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-pulse text-xl">Loading featured products...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
    </div>
  );
};

export default FeaturedProducts;
