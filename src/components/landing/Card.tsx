import React, { useState } from "react";
import { PackageX, Package as PackageIcon } from "lucide-react";

interface CardProps {
  productLine?: string;
  product?: string;
  source?: string;
  price?: number;
  msrp?: number;
  listingLink?: string;
  imageLink?: string;
  onListingClick?: () => void;
  index?: number;
  inStock?: boolean;
  lastSeenInStock?: string;
}

export const Card: React.FC<CardProps> = ({
  productLine = "Product Line",
  product = "Product",
  source = "Source",
  price,
  msrp,
  listingLink,
  imageLink,
  onListingClick,
  index = 0,
  inStock = true,
  lastSeenInStock,
}) => {
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  const discountPercentage = msrp && price && msrp > price
    ? Math.round(((msrp - price) / msrp) * 100)
    : null;
  
  const buttonLabel = inStock ? "View Listing" : "View Details";
  
  const StatusIcon = inStock ? PackageIcon : PackageX;

  const handleClick = () => {
    if (listingLink) {
      window.open(listingLink, "_blank");
    }
    if (onListingClick) {
      onListingClick();
    }
  };

  return (
    <div
      className="w-[340px] h-[480px] relative bg-white rounded-lg border border-rose-100 transition-all duration-300 overflow-hidden"
      role="article"
      style={{
        width: '340px', // Fixed width to ensure consistency
        minHeight: "480px",
      }}
    >
      <div className="w-[140px] h-[140px] mx-auto mt-6 overflow-hidden rounded-md bg-white">
        <img 
          src={imageLink || "https://via.placeholder.com/140x140?text=No+Image"} 
          alt={`${product} image`}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="px-[41px] py-[15px]">
        <div className="text-xl text-[#1E1E1E] mb-[6px]">{productLine}</div>
        <div className="text-xl text-[#1E1E1E] mb-[6px]">{product}</div>
        <div className="text-xl text-[#1E1E1E] mb-[6px]">{source}</div>
        
        <div className="space-y-1">
          {msrp && price && msrp > price && (
            <div className="text-sm line-through text-gray-500">
              MSRP: ${msrp.toFixed(2)}
            </div>
          )}
          
          {price && (
            <div className="flex items-baseline gap-2">
              <div className="text-xl text-[#1E1E1E]">
                {discountPercentage ? 'Sale: ' : ''}${price?.toFixed(2)}
              </div>
              
              {discountPercentage && (
                <div className="text-sm font-semibold text-green-600">
                  Save {discountPercentage}%
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={`flex items-center text-sm ${inStock ? 'text-green-600' : 'text-red-600'} mt-3`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
        </div>
        
        {!inStock && lastSeenInStock && (
          <div className="text-xs text-gray-500 mt-1">
            Last seen in stock: {lastSeenInStock}
          </div>
        )}
      </div>

      <button
        onClick={handleClick}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className="text-xl font-medium text-white absolute -translate-x-2/4 w-[257px] h-[50px] bg-red-500 hover:bg-red-600 rounded-md left-2/4 bottom-[16px] max-sm:w-[80%] transition-all duration-300 flex items-center justify-center"
        aria-label={`View listing for ${product}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
};
