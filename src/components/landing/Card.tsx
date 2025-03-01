import React, { useEffect, useState, useRef } from "react";

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
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<number | null>(null);
  
  // Disco colors array - vibrant colors for the effect
  const discoColors = [
    "#FF3366", // Pink
    "#33CCFF", // Blue
    "#FFCC33", // Yellow
    "#33FF99", // Green
    "#CC33FF", // Purple
    "#FF6633",  // Orange
    "#66FF33", // Lime
    "#FF33CC", // Magenta
    "#3366FF", // Royal Blue
    "#FF9933"  // Orange-Yellow
  ];

  // Function to get a random color index
  const getRandomColorIndex = () => {
    const newIndex = Math.floor(Math.random() * discoColors.length);
    // Avoid same color twice in a row
    return newIndex === colorIndex ? (newIndex + 1) % discoColors.length : newIndex;
  };

  useEffect(() => {
    // Start each card at a different position in the color array based on its index
    // This ensures cards have different colors from each other
    setColorIndex((index % discoColors.length));
    
    // Change the color at random intervals between 300-700ms for more dynamics
    const changeColor = () => {
      setColorIndex(getRandomColorIndex());
      
      // Set next interval with random timing
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current);
      }
      
      intervalRef.current = window.setTimeout(
        changeColor, 
        isHovered 
          ? Math.floor(Math.random() * 100) + 100 // Super fast when hovered: 100-200ms
          : Math.floor(Math.random() * 800) + 1200 // Normal speed: 1200-2000ms
      );
    };
    
    // Start the initial timeout
    intervalRef.current = window.setTimeout(
      changeColor, 
      isHovered 
        ? Math.floor(Math.random() * 100) + 100 
        : Math.floor(Math.random() * 800) + 1200
    );

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current);
      }
    };
  }, [index, isHovered]);

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
      className="w-[340px] h-[300px] relative bg-[#D9D9D9] rounded-[10px] max-md:mb-5 max-sm:w-full transition-all duration-800"
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="text-2xl italic font-light text-[#1E1E1E] absolute -translate-x-2/4 w-[257px] h-[66px] bg-[#D9D9D9] rounded-[22px] left-2/4 bottom-[9px] max-sm:w-4/5 transition-all duration-800 flex items-center justify-center"
        style={{
          border: `3px solid ${discoColors[colorIndex]}`,
          boxShadow: `0px 0px ${isHovered ? '12px 4px' : '8px 2px'} ${discoColors[colorIndex]}`,
          transition: isHovered ? 'all 0.2s ease' : 'all 0.8s ease'
        }}
      >
        Listing
      </button>
    </div>
  );
};
