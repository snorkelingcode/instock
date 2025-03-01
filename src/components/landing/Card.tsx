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
  const [cardColorIndex, setCardColorIndex] = useState(0);
  const [buttonColorIndex, setButtonColorIndex] = useState(0);
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
    "#FF6633",  // Orange
    "#66FF33", // Lime
    "#FF33CC", // Magenta
    "#3366FF", // Royal Blue
    "#FF9933"  // Orange-Yellow
  ];

  // Function to get a random color index
  const getRandomColorIndex = (currentIndex: number) => {
    const newIndex = Math.floor(Math.random() * discoColors.length);
    // Avoid same color twice in a row
    return newIndex === currentIndex ? (newIndex + 1) % discoColors.length : newIndex;
  };

  // Card animation effect
  useEffect(() => {
    // Start each card at a different position in the color array based on its index
    setCardColorIndex((index % discoColors.length));
    
    // Change the color at random intervals for the card (always at normal speed)
    const changeCardColor = () => {
      setCardColorIndex(getRandomColorIndex(cardColorIndex));
      
      // Set next interval with random timing
      if (cardIntervalRef.current) {
        window.clearTimeout(cardIntervalRef.current);
      }
      
      cardIntervalRef.current = window.setTimeout(
        changeCardColor, 
        Math.floor(Math.random() * 800) + 1200 // Always normal speed for card: 1200-2000ms
      );
    };
    
    // Start the initial timeout for card
    cardIntervalRef.current = window.setTimeout(
      changeCardColor, 
      Math.floor(Math.random() * 800) + 1200
    );

    // Clean up on unmount
    return () => {
      if (cardIntervalRef.current) {
        window.clearTimeout(cardIntervalRef.current);
      }
    };
  }, [index, cardColorIndex]);

  // Button animation effect (separate from card)
  useEffect(() => {
    // Start at a different color than the card
    setButtonColorIndex(((index + 3) % discoColors.length));
    
    // Change the color at random intervals for the button
    const changeButtonColor = () => {
      setButtonColorIndex(getRandomColorIndex(buttonColorIndex));
      
      // Set next interval with random timing
      if (buttonIntervalRef.current) {
        window.clearTimeout(buttonIntervalRef.current);
      }
      
      buttonIntervalRef.current = window.setTimeout(
        changeButtonColor, 
        isButtonHovered 
          ? Math.floor(Math.random() * 100) + 100 // Super fast when hovered: 100-200ms
          : Math.floor(Math.random() * 800) + 1200 // Normal speed: 1200-2000ms
      );
    };
    
    // Start the initial timeout for button
    buttonIntervalRef.current = window.setTimeout(
      changeButtonColor, 
      isButtonHovered 
        ? Math.floor(Math.random() * 100) + 100 
        : Math.floor(Math.random() * 800) + 1200
    );

    // Clean up on unmount
    return () => {
      if (buttonIntervalRef.current) {
        window.clearTimeout(buttonIntervalRef.current);
      }
    };
  }, [index, buttonColorIndex, isButtonHovered]);

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
        boxShadow: `0px 4px 30px 10px ${discoColors[cardColorIndex]}`,
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
        style={{
          border: `3px solid ${discoColors[buttonColorIndex]}80`, // Added 80 hex for 50% opacity
          boxShadow: `0px 0px ${isButtonHovered ? '12px 4px' : '8px 2px'} ${discoColors[buttonColorIndex]}60`, // Added 60 hex for ~40% opacity
          transition: isButtonHovered ? 'all 0.2s ease' : 'all 0.8s ease'
        }}
      >
        Listing
      </button>
    </div>
  );
};
