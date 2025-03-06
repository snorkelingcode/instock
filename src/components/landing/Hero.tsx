
import React, { useState, useEffect, useRef } from "react";

export const Hero: React.FC = () => {
  const [colorIndex, setColorIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Softer color palette matching the card component
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

  // Function to get a random color index
  const getRandomColorIndex = () => {
    const newIndex = Math.floor(Math.random() * softColors.length);
    // Avoid same color twice in a row
    return newIndex === colorIndex ? (newIndex + 1) % softColors.length : newIndex;
  };

  useEffect(() => {
    // Change the color at slower intervals (5-7 seconds)
    const changeColor = () => {
      setColorIndex(getRandomColorIndex());
      
      // Set next interval with slower timing
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current);
      }
      
      intervalRef.current = window.setTimeout(
        changeColor, 
        Math.floor(Math.random() * 2000) + 5000 // Random interval between 5000-7000ms
      );
    };
    
    // Start the initial timeout
    intervalRef.current = window.setTimeout(changeColor, Math.floor(Math.random() * 2000) + 5000);

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current);
      }
    };
  }, []);

  // Enhanced text styling with stronger glow effect
  const textStyle = {
    textShadow: `0 0 5px ${softColors[colorIndex]}80, 
                 0 0 15px ${softColors[colorIndex]}60,
                 0 0 25px ${softColors[colorIndex]}40`, // Increased blur radius and added a third layer
    transition: 'all 1.2s ease', // Slower transition
    color: '#1E1E1E', // Keep text dark
  };

  return (
    <header className="mb-[164px] max-md:mb-20 max-sm:mb-10" role="banner">
      <h1 
        className="text-[64px] text-[#1E1E1E] font-normal max-md:text-5xl max-sm:text-4xl"
        style={textStyle}
      >
        Find everything in stock.
      </h1>
      <h2 
        className="text-[64px] text-[#1E1E1E] font-normal max-md:text-5xl max-sm:text-4xl"
        style={textStyle}
      >
        In one place.
      </h2>
    </header>
  );
};
