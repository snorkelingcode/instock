import React from "react";

// Featured product component with toned down effect
const FeaturedProduct = ({ title, description, price, retailer, listingLink, index = 0 }) => {
  const [cardColor, setCardColor] = React.useState("");
  const [isButtonHovered, setIsButtonHovered] = React.useState(false);
  
  // Softer color palette with less contrast - Same as Card component
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
  const getRandomColor = (currentColor) => {
    const filteredColors = softColors.filter(color => color !== currentColor);
    return filteredColors[Math.floor(Math.random() * filteredColors.length)];
  };

  // Card animation effect (much slower, subtler transition)
  React.useEffect(() => {
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

  // Handle button click to open the listing URL
  const handleListingClick = () => {
    if (listingLink) {
      window.open(listingLink, "_blank");
    }
  };

  return (
    <div
      className="w-[340px] h-[300px] relative bg-[#F5F5F7] rounded-[10px] max-md:mb-5 max-sm:w-full transition-all duration-1000"
      style={{
        boxShadow: cardColor ? `0px 2px 15px 2px ${cardColor}40` : undefined, // Reduced glow with 25% opacity
        border: cardColor ? `1px solid ${cardColor}60` : undefined, // Subtle border
      }}
    >
      <div className="px-[41px] py-[30px]">
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{title}</div>
        <div className="text-sm text-[#1E1E1E] mb-[5px]">{description}</div>
        <div className="text-lg text-[#1E1E1E] mb-[5px] font-medium">${price.toFixed(2)}</div>
        <div className="text-sm text-[#1E1E1E] mb-[5px]">at {retailer}</div>
        <div className="text-sm font-medium text-green-600">
          In Stock
        </div>
      </div>
      <button
        onClick={handleListingClick}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className="text-2xl italic font-light text-[#1E1E1E] absolute -translate-x-2/4 w-[257px] h-[66px] bg-[#F0F0F5] rounded-[22px] left-2/4 bottom-[9px] max-sm:w-4/5 transition-all duration-800 flex items-center justify-center"
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

export default FeaturedProduct;
