import React, { useState, useEffect, useRef } from "react";
import DiscoCardEffect from "@/components/DiscoCardEffect";

export const Hero: React.FC = () => {
  const [colorIndex, setColorIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Disco colors array - same as in DiscoCardEffect for consistency
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

  // Function to get a random color index
  const getRandomColorIndex = () => {
    const newIndex = Math.floor(Math.random() * discoColors.length);
    // Avoid same color twice in a row
    return newIndex === colorIndex ? (newIndex + 1) % discoColors.length : newIndex;
  };

  useEffect(() => {
    // Change the color at random intervals between 1200-2000ms for dynamics
    const changeColor = () => {
      setColorIndex(getRandomColorIndex());
      
      // Set next interval with random timing
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current);
      }
      
      intervalRef.current = window.setTimeout(
        changeColor, 
        Math.floor(Math.random() * 800) + 1200 // Random interval between 1200-2000ms
      );
    };
    
    // Start the initial timeout
    intervalRef.current = window.setTimeout(changeColor, Math.floor(Math.random() * 800) + 1200);

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        window.clearTimeout(intervalRef.current);
      }
    };
  }, []);

  // Text styling with disco effect - blurred version
  const textStyle = {
    textShadow: `0 0 4px ${discoColors[colorIndex]}, 
                 0 0 10px ${discoColors[colorIndex]}, 
                 0 0 15px ${discoColors[colorIndex]}, 
                 0 0 20px ${discoColors[colorIndex]}`,
    transition: 'all 0.8s ease',
    color: '#1E1E1E', // Keep text dark
  };

  return (
    <DiscoCardEffect index={99} className="mb-[164px] max-md:mb-20 max-sm:mb-10 bg-white rounded-lg p-8">
      <header role="banner">
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
    </DiscoCardEffect>
  );
};

export default Hero;
