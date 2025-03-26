
import React from "react";
import { packageX, package as packageIcon } from "lucide-react";

interface CardProps {
  productLine: string;
  product: string;
  source: string;
  price: number;
  msrp?: number;
  listingLink: string;
  imageLink?: string;
  onListingClick?: () => void;
  index: number;
  inStock?: boolean;
  lastSeenInStock?: string;
}

export const Card = ({
  productLine,
  product,
  source,
  price,
  msrp,
  listingLink,
  imageLink,
  onListingClick,
  index,
  inStock = true,
  lastSeenInStock,
}: CardProps) => {
  const discount = msrp ? Math.round(((msrp - price) / msrp) * 100) : 0;
  
  // Default image if none provided
  const defaultImage = "https://via.placeholder.com/140x140?text=No+Image";
  
  // Determine if discount is worth showing (> 0%)
  const showDiscount = discount > 0;
  
  // Different button label based on stock status
  const buttonLabel = inStock ? "View Listing" : "View Details";
  
  // Different icon based on stock status
  const StatusIcon = inStock ? packageIcon : packageX;

  return (
    <div
      className="w-full max-w-[340px] h-full bg-white rounded-[10px] p-4 shadow-md flex flex-col"
      style={{ minHeight: "480px" }}
    >
      {/* Product Image */}
      <div className="flex justify-center items-center py-4">
        <img
          src={imageLink || defaultImage}
          alt={product}
          className="w-[140px] h-[140px] object-contain"
          loading="lazy"
        />
      </div>

      {/* Product Details */}
      <div className="px-[20px] py-[15px] flex-grow flex flex-col">
        <div className="text-[14px] text-[#6B7280] uppercase tracking-wide">
          {productLine}
        </div>
        <div className="text-[18px] font-semibold text-[#111827] line-clamp-2 h-12 mb-1">
          {product}
        </div>
        <div className="text-[14px] text-[#4B5563] mb-1">{source}</div>
        
        {/* Price and MSRP */}
        <div className="flex items-baseline mt-1 mb-2">
          <div className="text-[18px] font-semibold text-[#111827]">
            ${price.toFixed(2)}
          </div>
          {showDiscount && msrp && (
            <>
              <div className="text-[14px] text-[#6B7280] line-through ml-2">
                ${msrp.toFixed(2)}
              </div>
              <div className="text-[14px] text-[#10B981] ml-2">
                {discount}% off
              </div>
            </>
          )}
        </div>

        {/* Stock Status Indicator */}
        <div className={`flex items-center text-sm ${inStock ? 'text-green-600' : 'text-red-600'} mb-2`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
        </div>
        
        {/* Last Seen In-Stock - Only show for out of stock items */}
        {!inStock && lastSeenInStock && (
          <div className="text-xs text-gray-500 mb-2">
            Last seen in stock: {lastSeenInStock}
          </div>
        )}
      </div>

      {/* View Listing Button */}
      <div className="px-[20px] pt-2 pb-[20px]">
        <a
          href={listingLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onListingClick}
          className={`w-full block text-center py-[13px] px-[25px] rounded-[4px] font-semibold text-[14px] ${
            inStock 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          } transition-colors`}
        >
          {buttonLabel}
        </a>
      </div>
    </div>
  );
};
