
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface FeaturedProductProps {
  title: string;
  description: string;
  price: number;
  msrp?: number;
  retailer: string;
  listingLink: string;
  imageLink?: string;
  inStock?: boolean;
  index: number;
}

const FeaturedProduct: React.FC<FeaturedProductProps> = ({
  title,
  description,
  price,
  msrp,
  retailer,
  listingLink,
  imageLink,
  inStock = false,
  index
}) => {
  // Default placeholder image if none provided
  const defaultImage = "/lovable-uploads/05e57c85-5441-4fff-b945-4a5e864300ce.png";
  
  // Calculate discount percentage if MSRP is provided and price is less than MSRP
  const discountPercentage = msrp && msrp > price
    ? Math.round(((msrp - price) / msrp) * 100)
    : null;
  
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow overflow-hidden">
      <div className="aspect-square w-full overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          src={imageLink || defaultImage}
          alt={title}
          className="h-48 w-auto object-contain mx-auto"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold line-clamp-2">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-500">
          {retailer}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-xl font-bold text-primary">${price.toFixed(2)}</p>
          
          {msrp && msrp > price && (
            <p className="text-sm text-gray-500 line-through">
              ${msrp.toFixed(2)}
            </p>
          )}
          
          {discountPercentage && (
            <span className="ml-auto text-sm font-semibold text-green-600">
              Save {discountPercentage}%
            </span>
          )}
        </div>
        
        {msrp && !(msrp > price) && (
          <p className="text-sm text-gray-500 mb-2">
            MSRP: ${msrp.toFixed(2)}
          </p>
        )}
        
        <p className="text-sm text-gray-700 line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          disabled={!inStock || !listingLink}
          onClick={() => {
            if (listingLink) {
              window.open(listingLink, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          View Listing <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeaturedProduct;
