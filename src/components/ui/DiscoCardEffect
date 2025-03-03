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
  
  // Disco colors array - same as in Card component for consistency
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
