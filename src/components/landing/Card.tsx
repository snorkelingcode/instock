import React from "react";

interface CardProps {
  productLine?: string;
  product?: string;
  source?: string;
  price?: number;
  listingLink?: string;
  onListingClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  productLine = "Product Line",
  product = "Product",
  source = "Source",
  price,
  listingLink,
  onListingClick,
}) => {
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
      className="w-full h-full shadow-[0px_4px_24px_0px_rgba(0,0,0,0.15)] relative bg-[#9A9A9A] rounded-[10px] flex flex-col"
      role="article"
    >
      <div className="px-3 py-2 flex-grow">
        <div className="text-sm text-[#1E1E1E] mb-1 truncate">{productLine}</div>
        <div className="text-sm text-[#1E1E1E] mb-1 truncate">{product}</div>
        <div className="text-sm text-[#1E1E1E] mb-1 truncate">{source}</div>
        {price && (
          <div className="text-sm text-[#1E1E1E] mb-1">${price.toFixed(2)}</div>
        )}
      </div>
      <div className="flex justify-center pb-2 mt-auto">
        <button
          onClick={handleClick}
          className="text-lg italic font-light text-[#1E1E1E] w-[90%] h-[45px] bg-[#8696E8] rounded-[22px] hover:bg-[#7485d7] transition-colors duration-200 flex items-center justify-center"
        >
          Listing
        </button>
      </div>
    </div>
  );
};
