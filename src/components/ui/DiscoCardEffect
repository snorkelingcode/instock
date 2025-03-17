
import React, { useState, useEffect, useRef } from "react";

interface DiscoCardEffectProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

const DiscoCardEffect: React.FC<DiscoCardEffectProps> = ({
  children,
  className = "",
  index = 0
}) => {
  const [cardColor, setCardColor] = useState("");
  const cardIntervalRef = useRef<number | null>(null);
  
  // Red shades array for the disco effect
  const discoColors = [
    "#FF0000", // Pure red
    "#DC143C", // Crimson
    "#CD5C5C", // Indian Red
    "#B22222", // Firebrick
    "#A52A2A", // Brown
    "#FF6347", // Tomato
    "#FF4500", // OrangeRed
    "#E34234", // Vermilion
    "#C41E3A", // Cardinal
    "#D70040"  // Crimson glory
  ];

  // Function to get a random color that's different from the current one
  const getRandomColor = (currentColor: string) => {
    const filteredColors = discoColors.filter(color => color !== currentColor);
    return filteredColors[Math.floor(Math.random() * filteredColors.length)];
  };

  // Card animation effect
  useEffect(() => {
    // Initialize with a color based on index to make cards different
    if (!cardColor) {
      setCardColor(discoColors[index % discoColors.length]);
      return; // Exit after initial setup to avoid immediate color change
    }
    
    const animateCard = () => {
      const newColor = getRandomColor(cardColor);
      setCardColor(newColor);
    };
    
    // Create the animation interval
    const intervalId = window.setInterval(
      animateCard, 
      Math.floor(Math.random() * 800) + 1200 // Random interval between 1200-2000ms
    );
    
    cardIntervalRef.current = intervalId;
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (cardIntervalRef.current !== null) {
        window.clearInterval(cardIntervalRef.current);
      }
    };
  }, [cardColor, index]);

  return (
    <div
      className={`relative transition-all duration-800 ${className}`}
      style={{
        boxShadow: cardColor ? `0px 4px 30px 10px ${cardColor}` : undefined
      }}
    >
      {children}
    </div>
  );
};

export default DiscoCardEffect;
