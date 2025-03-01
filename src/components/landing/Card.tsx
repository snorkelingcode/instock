import React, { useEffect, useState } from "react";

interface CardProps {
  productLine?: string;
  product?: string;
  source?: string;
  price?: number;
  listingLink?: string;
  onListingClick?: () => void;
  index?: number;
}

export const Card: React.FC<CardProps> = ({
  productLine = "Product Line",
  product = "Product",
  source = "Source",
  price,
  listingLink,
  onListingClick,
  index = 0,
}) => {
  const [colorIndex, setColorIndex] = useState(0);
  
  // Disco colors array - vibrant colors for the effect
  const discoColors = [
    "#FF3366", // Pink
    "#33CCFF", // Blue
    "#FFCC33", // Yellow
    "#33FF99", // Green
    "#CC33FF", // Purple
    "#FF6633"  // Orange
  ];

  useEffect(() => {
    // Start each card at a different position in the color array based on its index
    // This ensures cards have different colors from each other
    setColorIndex((index % discoColors.length));
    
    // Change the color every 1 second for the disco effect
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % discoColors.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [index]);

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
      className="w-[340px] h-[295px] relative bg-[#9A9A9A] rounded-[10px] max-md:mb-5 max-sm:w-full transition-all duration-1000"
      role="article"
      style={{
        boxShadow: `0px 4px 30px 10px ${discoColors[colorIndex]}`,
      }}
    >
      <div className="px-[41px] py-[30px]">
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{productLine}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{product}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{source}</div>
        {price && (
          <div className="text-xl text-[#1E1E1E] mb-[5px]">${price.toFixed(2)}</div>
        )}
      </div>
      <button
        onClick={handleClick}
        className="text-2xl italic font-light text-[#1E1E1E] absolute -translate-x-2/4 w-[257px] h-[66px] bg-[#8696E8] rounded-[22px] left-2/4 bottom-[9px] max-sm:w-4/5 hover:bg-[#7485d7] transition-colors duration-200 flex items-center justify-center"
      >
        Listing
      </button>
    </div>
  );
};
