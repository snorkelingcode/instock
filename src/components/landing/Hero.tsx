
import React, { useState, useEffect, useRef } from "react";

export const Hero: React.FC = () => {
  const [colorIndex, setColorIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Red shades palette replacing the soft colors
  const redShades = [
    "#FF3333", // Bright red
    "#CC0000", // Dark red
    "#FF6666", // Light red
    "#990000", // Deep red
    "#FF4444", // Strong red
    "#CC3333", // Medium red
    "#FF8888", // Pale red
    "#AA0000", // Ruby red
    "#FF5555", // Cherry red
    "#BB2222"  // Crimson red
  ];

  // Function to get a random color index
  const getRandomColorIndex = () => {
    const newIndex = Math.floor(Math.random() * redShades.length);
    // Avoid same color twice in a row
    return newIndex === colorIndex ? (newIndex + 1) % redShades.length : newIndex;
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

  // Significantly enhanced text styling with much stronger glow effect
  const textStyle = {
    textShadow: `0 0 10px ${redShades[colorIndex]}90, 
                 0 0 20px ${redShades[colorIndex]}80,
                 0 0 30px ${redShades[colorIndex]}70, 
                 0 0 40px ${redShades[colorIndex]}60,
                 0 0 50px ${redShades[colorIndex]}50`, // Multiple layers with increased intensity
    transition: 'all 1.5s ease', // Slightly slower transition for smoother effect
    color: '#1E1E1E', // Keep text dark
  };

  return (
    <header className="mb-10 max-md:mb-8 max-sm:mb-6" role="banner">
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
