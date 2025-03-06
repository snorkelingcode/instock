import React, { useEffect, useState, useRef } from "react";

interface CardProps {
  productLine?: string;
  product?: string;
  source?: string;
  price?: number;
  listingLink?: string;
  imageLink?: string; // New prop for image link
  onListingClick?: () => void;
  index?: number;
}

export const Card: React.FC<CardProps> = ({
  productLine = "Product Line",
  product = "Product",
  source = "Source",
  price,
  listingLink,
  imageLink, // Add image link prop
  onListingClick,
  index = 0,
}) => {
  const [cardColor, setCardColor] = useState("");
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  // Softer color palette with less contrast
  const softColors = [
    "#5B8BF0", // Soft blue
    "#63AABF", // Teal blue
    "#4E9D63", // Forest green
    "#7E7ED4", // Lavender
    "#8E87C0", // Muted purple
    "#DC8A86", // Dusty rose
    "#E6A971", // Soft orange
    "#68B9C0", // Turquoise
    "#7FB88F", // Sage green
    "#9F8FC1"  // Periwinkle
  ];

  // Function to get a random color that's different from the current one
  const getRandomColor = (currentColor: string) => {
    const filteredColors = softColors.filter(color => color !== currentColor);
    return filteredColors[Math.floor(Math.random() * filteredColors.length)];
  };

  // Card animation effect (much slower, subtler transition)
  useEffect(() => {
    // Initialize with a color based on index to make cards different
    if (!cardColor) {
      setCardColor(softColors[index % softColors.length]);
      return; // Exit after initial setup to avoid immediate color change
    }
    
    const animateCard = () => {
      const newColor = getRandomColor(cardColor);
      setCardColor(newColor);
    };
    
    // Create the animation interval with much slower timing (5-7 seconds)
    const intervalId = window.setInterval(
      animateCard, 
      Math.floor(Math.random() * 2000) + 5000 // Slow speed: 5000-7000ms
    );
    
    // Clean up on unmount or when dependencies change
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
      className="w-[340px] h-[300px] relative bg-white rounded-[10px] max-md:mb-5 max-sm:w-full transition-all duration-1000 overflow-hidden"
      role="article"
      style={{
        boxShadow: cardColor ? `0px 2px 15px 2px ${cardColor}40` : undefined, // Reduced glow with 25% opacity
        border: cardColor ? `1px solid ${cardColor}60` : undefined, // Subtle border
      }}
    >
      {/* Square image container */}
      {imageLink && (
        <div className="w-[140px] h-[140px] mx-auto mt-4 overflow-hidden rounded-md bg-white">
          <img 
            src={imageLink} 
            alt={`${product} image`}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Set a fallback image or hide on error
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className={`px-[41px] ${imageLink ? 'py-[10px]' : 'py-[30px]'}`}>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{productLine}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{product}</div>
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{source}</div>
        {price && (
          <div className="text-xl text-[#1E1E1E] mb-[5px]">${price.toFixed(2)}</div>
        )}
      </div>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className="text-2xl italic font-light text-[#1E1E1E] absolute -translate-x-2/4 w-[257px] h-[66px] bg-white rounded-[22px] left-2/4 bottom-[9px] max-sm:w-4/5 transition-all duration-800 flex items-center justify-center"
        style={{
          border: `1px solid ${cardColor}60`, // Subtle border that matches card color
          boxShadow: isButtonHovered 
            ? `0px 2px 8px 1px ${cardColor}50` // Slightly enhanced glow on hover
            : `0px 1px 4px 0px ${cardColor}30`, // Very subtle shadow normally
          transition: 'all 0.3s ease'
        }}
      >
        Listing
      </button>
    </div>
  );
};
