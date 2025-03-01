
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
      className="w-full max-w-[340px] h-[295px] shadow-[0px_4px_250px_0px_#000] relative bg-[#9A9A9A] rounded-[10px] flex flex-col"
      role="article"
    >
      <div className="px-[41px] py-[30px] flex-grow">
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{productLine}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{product}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{source}</div>
        {price && (
          <div className="text-xl text-[#1E1E1E] mb-[5px]">${price.toFixed(2)}</div>
        )}
      </div>
      <div className="flex justify-center pb-[9px]">
        <button
          onClick={handleClick}
          className="text-2xl italic font-light text-[#1E1E1E] w-[80%] max-w-[257px] h-[66px] bg-[#8696E8] rounded-[22px] hover:bg-[#7485d7] transition-colors duration-200 flex items-center justify-center"
        >
          Listing
        </button>
      </div>
    </div>
  );
};
