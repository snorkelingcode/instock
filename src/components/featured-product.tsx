
import React from "react";

// Featured product component with toned down effect
const FeaturedProduct = ({ title, description, price, retailer, listingLink, imageLink, index = 0 }) => {
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
      className="w-[340px] h-[480px] relative bg-white rounded-[10px] max-md:mb-5 transition-all duration-1000 overflow-hidden"
      style={{
        boxShadow: cardColor ? `0px 2px 15px 2px ${cardColor}40` : undefined, // Reduced glow with 25% opacity
        border: cardColor ? `1px solid ${cardColor}60` : undefined, // Subtle border
        width: 'min(340px, 100%)', // Ensures card never exceeds container width
      }}
    >
      {/* Updated image container to match the Card component size */}
      {imageLink && (
        <div className="w-[140px] h-[140px] mx-auto mt-6 overflow-hidden rounded-md bg-white">
          <img 
            src={imageLink} 
            alt={`${title} image`}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Set a fallback image or hide on error
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className={`px-[41px] ${imageLink ? 'py-[15px]' : 'py-[30px]'}`}>
        <div className="text-xl text-[#1E1E1E] mb-[6px]">{title}</div>
        <div className="text-sm text-[#1E1E1E] mb-[8px]">{description}</div>
        <div className="text-lg text-[#1E1E1E] mb-[6px] font-medium">${price.toFixed(2)}</div>
        <div className="text-sm font-medium text-green-600">
          In Stock
        </div>
      </div>
      <button
        onClick={handleListingClick}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className="text-xl font-medium text-white absolute -translate-x-2/4 w-[257px] h-[50px] bg-red-500 hover:bg-red-600 rounded-md left-2/4 bottom-[16px] max-sm:w-[80%] transition-all duration-300 flex items-center justify-center"
        aria-label={`View listing for ${title}`}
      >
        View Listing
      </button>
    </div>
  );
};

export default FeaturedProduct;
