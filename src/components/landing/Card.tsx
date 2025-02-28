
import React from "react";
import { Product } from "@/services/ProductService";

interface CardProps {
  productLine?: string;
  product?: string;
  source?: string;
  inStock?: boolean;
  url?: string;
  lastChecked?: string;
  onListingClick?: () => void;
  isPlaceholder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  productLine = "Product Line",
  product = "Product",
  source = "Source",
  inStock = false,
  url,
  lastChecked,
  onListingClick,
  isPlaceholder = false,
}) => {
  if (isPlaceholder) {
    return <div className="w-[340px] h-[295px] invisible max-md:hidden" />;
  }

  const formattedDate = lastChecked 
    ? new Date(lastChecked).toLocaleString()
    : 'Not checked yet';

  return (
    <div
      className="w-[340px] h-[295px] shadow-[0px_4px_250px_0px_#000] relative bg-[#9A9A9A] rounded-[10px] max-md:mb-5 max-sm:w-full"
      role="article"
    >
      <div className="px-[41px] py-[30px]">
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{productLine}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{product}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{source}</div>
        {lastChecked && (
          <div className="text-sm text-[#1E1E1E] mb-[5px]">
            Last checked: {formattedDate}
          </div>
        )}
        <div className={`text-sm font-semibold ${inStock ? 'text-green-700' : 'text-red-700'}`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </div>
      </div>
      <button
        onClick={onListingClick}
        className="text-2xl italic font-light text-[#1E1E1E] absolute -translate-x-2/4 w-[257px] h-[66px] bg-[#8696E8] rounded-[22px] left-2/4 bottom-[9px] max-sm:w-4/5 hover:bg-[#7485d7] transition-colors duration-200 flex items-center justify-center"
      >
        Listing
      </button>
    </div>
  );
};
