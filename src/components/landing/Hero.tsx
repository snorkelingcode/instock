
import React, { useState, useEffect, useRef } from "react";

export const Hero: React.FC = () => {
  const [colorIndex, setColorIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Green shades palette replacing the red shades
  const greenShades = [
    "#50C878", // Emerald green
    "#228B22", // Forest green
    "#7CFC00", // Lawn green
    "#32CD32", // Lime green
    "#00FF00", // Bright green
    "#008000", // Medium green
    "#ADFF2F", // Green yellow
    "#006400", // Dark green
    "#90EE90", // Light green
    "#2E8B57"  // Sea green
  ];

  // Function to get a random color index
  const getRandomColorIndex = () => {
    const newIndex = Math.floor(Math.random() * greenShades.length);
    // Avoid same color twice in a row
    return newIndex === colorIndex ? (newIndex + 1) % greenShades.length : newIndex;
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
    textShadow: `0 0 10px ${greenShades[colorIndex]}90, 
                 0 0 20px ${greenShades[colorIndex]}80,
                 0 0 30px ${greenShades[colorIndex]}70, 
                 0 0 40px ${greenShades[colorIndex]}60,
                 0 0 50px ${greenShades[colorIndex]}50`, // Multiple layers with increased intensity
    transition: 'all 1.5s ease', // Slightly slower transition for smoother effect
    color: '#1E1E1E', // Keep text dark
  };

  return (
    <header className="mb-10 max-md:mb-8 max-sm:mb-6" role="banner">
      <h1 
        className="text-[64px] text-[#1E1E1E] font-normal max-md:text-5xl max-sm:text-4xl"
        style={textStyle}
      >
        News. Products. DIY.
      </h1>
      <h2 
        className="text-[64px] text-[#1E1E1E] font-normal max-md:text-5xl max-sm:text-4xl"
        style={textStyle}
      >
        All things TCG.
      </h2>
    </header>
  );
};
