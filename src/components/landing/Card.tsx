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
  const [cardColor, setCardColor] = useState("");
  const [buttonColor, setButtonColor] = useState("");
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const cardIntervalRef = useRef<number | null>(null);
  const buttonIntervalRef = useRef<number | null>(null);
  
  // Disco colors array - vibrant colors for the effect
  const discoColors = [
    "#FF3366", // Pink
    "#33CCFF", // Blue
    "#FFCC33", // Yellow
    "#33FF99", // Green
    "#CC33FF", // Purple
    "#FF6633", // Orange
    "#66FF33", // Lime
    "#FF33CC", // Magenta
    "#3366FF", // Royal Blue
    "#FF9933"  // Orange-Yellow
  ];

  // Function to get a random color that's different from the current one
  const getRandomColor = (currentColor: string) => {
    const filteredColors = discoColors.filter(color => color !== currentColor);
    return filteredColors[Math.floor(Math.random() * filteredColors.length)];
  };

  // Card animation effect (normal speed always)
  useEffect(() => {
    // Initialize with a color based on index to make cards different
    setCardColor(discoColors[index % discoColors.length]);
    
    const animateCard = () => {
      const newColor = getRandomColor(cardColor);
      setCardColor(newColor);
      
      // Clear any existing timeout
      if (cardIntervalRef.current) {
        window.clearTimeout(cardIntervalRef.current);
      }
      
      // Schedule next color change
      cardIntervalRef.current = window.setTimeout(
        animateCard, 
        Math.floor(Math.random() * 800) + 1200 // Normal speed: 1200-2000ms
      );
    };
    
    // Start the animation
    cardIntervalRef.current = window.setTimeout(animateCard, 1200);
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (cardIntervalRef.current) {
        window.clearTimeout(cardIntervalRef.current);
      }
    };
  }, [cardColor, index]);

  // Button animation effect (speed varies with hover)
  useEffect(() => {
    // Initialize with a different color than the card
    if (!buttonColor) {
      const startIndex = (index + 3) % discoColors.length;
      setButtonColor(discoColors[startIndex]);
    }
    
    const animateButton = () => {
      const newColor = getRandomColor(buttonColor);
      setButtonColor(newColor);
      
      // Clear any existing timeout
      if (buttonIntervalRef.current) {
        window.clearTimeout(buttonIntervalRef.current);
      }
      
      // Schedule next color change at speed based on hover state
      buttonIntervalRef.current = window.setTimeout(
        animateButton, 
        isButtonHovered 
          ? Math.floor(Math.random() * 100) + 100 // Super fast: 100-200ms
          : Math.floor(Math.random() * 800) + 1200 // Normal: 1200-2000ms
      );
    };
    
    // Start the animation at appropriate speed
    buttonIntervalRef.current = window.setTimeout(
      animateButton, 
      isButtonHovered ? 150 : 1200
    );
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (buttonIntervalRef.current) {
        window.clearTimeout(buttonIntervalRef.current);
      }
    };
  }, [buttonColor, isButtonHovered, index]);

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
        boxShadow: cardColor ? `0px 4px 30px 10px ${cardColor}` : undefined
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
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className="text-2xl italic font-light text-[#1E1E1E] absolute -translate-x-2/4 w-[257px] h-[66px] bg-[#D9D9D9] rounded-[22px] left-2/4 bottom-[9px] max-sm:w-4/5 transition-all duration-800 flex items-center justify-center"
        style={buttonColor ? {
          border: `3px solid ${buttonColor}80`, // 50% opacity
          boxShadow: `0px 0px ${isButtonHovered ? '12px 4px' : '8px 2px'} ${buttonColor}60`, // 40% opacity
          transition: isButtonHovered ? 'all 0.2s ease' : 'all 0.8s ease'
        } : undefined}
      >
        Listing
      </button>
    </div>
  );
};
