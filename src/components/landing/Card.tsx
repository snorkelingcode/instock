
import React, { useEffect, useState } from "react";

interface CardProps {
  productLine?: string;
  product?: string;
  source?: string;
  price?: number;
  listingLink?: string;
  imageLink?: string;
  onListingClick?: () => void;
  index?: number;
}

export const Card: React.FC<CardProps> = ({
  productLine = "Product Line",
  product = "Product",
  source = "Source",
  price,
  listingLink,
  imageLink,
  onListingClick,
  index = 0,
}) => {
  const [cardColor, setCardColor] = useState("");
  
  const softColors = [
    "#5B8BF0",
    "#63AABF",
    "#4E9D63",
    "#7E7ED4",
    "#8E87C0",
    "#DC8A86",
    "#E6A971",
    "#68B9C0",
    "#7FB88F",
    "#9F8FC1"
  ];

  const getRandomColor = (currentColor: string) => {
    const filteredColors = softColors.filter(color => color !== currentColor);
    return filteredColors[Math.floor(Math.random() * filteredColors.length)];
  };

  useEffect(() => {
    if (!cardColor) {
      setCardColor(softColors[index % softColors.length]);
      return;
    }
    
    const animateCard = () => {
      const newColor = getRandomColor(cardColor);
      setCardColor(newColor);
    };
    
    const intervalId = window.setInterval(
      animateCard, 
      Math.floor(Math.random() * 2000) + 5000
    );
    
    return () => {
      window.clearInterval(intervalId);
    };
  }, [cardColor, index]);

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
      className="w-[340px] h-[480px] relative bg-white rounded-[10px] max-md:mb-5 transition-all duration-1000 overflow-hidden shadow-md hover:shadow-lg"
      role="article"
      style={{
        boxShadow: cardColor ? `0px 2px 15px 2px ${cardColor}40` : undefined,
        border: cardColor ? `1px solid ${cardColor}60` : undefined,
        borderTop: cardColor ? `4px solid ${cardColor}` : undefined,
        width: 'min(340px, 100%)', // Ensures card never exceeds container width
      }}
    >
      {imageLink && (
        <div className="w-[140px] h-[140px] mx-auto mt-6 overflow-hidden rounded-md bg-white">
          <img 
            src={imageLink} 
            alt={`${product} image`}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className={`px-[41px] ${imageLink ? 'py-[15px]' : 'py-[30px]'}`}>
        <div className="text-xl text-[#1E1E1E] mb-[6px]">{productLine}</div>
        <div className="text-xl text-[#1E1E1E] mb-[6px]">{product}</div>
        <div className="text-xl text-[#1E1E1E] mb-[6px]">{source}</div>
        {price && (
          <div className="text-xl text-[#1E1E1E] mb-[6px]">${price.toFixed(2)}</div>
        )}
      </div>
      <button
        onClick={handleClick}
        className="w-[257px] h-[50px] flex items-center justify-center absolute -translate-x-2/4 left-2/4 bottom-[16px] max-sm:w-[80%] transition-all duration-300 text-white rounded-md"
        style={{
          backgroundColor: cardColor,
        }}
      >
        View Listing
      </button>
    </div>
  );
};
