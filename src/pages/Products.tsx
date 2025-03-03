import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CardGrid } from "@/components/landing/CardGrid";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Navigation component from other pages
const Navigation = () => (
  <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
    <Link to="/" className="text-xl font-bold">Pokemon In-Stock Tracker</Link>
    
    <div className="hidden md:flex space-x-6">
      <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
      <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium">Products</Link>
      <Link to="/news" className="text-gray-700 hover:text-blue-600">News</Link>
      <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
      <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
    </div>
    
    <Button className="md:hidden">Menu</Button>
  </nav>
);

// Footer component from other pages
const Footer = () => (
  <footer className="bg-white p-8 rounded-lg shadow-md mt-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="font-semibold mb-4">Pokemon In-Stock Tracker</h3>
        <p className="text-gray-600 mb-4">
          Helping Pokemon fans find products in stock since 2024.
        </p>
        <p className="text-gray-600">© 2025 In-Stock Tracker. All rights reserved.</p>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Site Links</h3>
        <ul className="space-y-2">
          <li><Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link></li>
          <li><Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link></li>
          <li><Link to="/news" className="text-gray-600 hover:text-blue-600">News</Link></li>
          <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link></li>
          <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link></li>
        </ul>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Legal</h3>
        <ul className="space-y-2">
          <li><Link to="/privacy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
          <li><Link to="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
          <li><Link to="/cookies" className="text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
        </ul>
      </div>
    </div>
  </footer>
);

// Featured product component with disco effect (similar to Index page)
const FeaturedProduct = ({ title, description, imageUrl, price, retailer, inStock, index = 0 }) => {
  const [cardColor, setCardColor] = useState("");
  const [buttonColor, setButtonColor] = useState("");
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const cardIntervalRef = useRef(null);
  const buttonIntervalRef = useRef(null);
  
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
  const getRandomColor = (currentColor) => {
    const filteredColors = discoColors.filter(color => color !== currentColor);
    return filteredColors[Math.floor(Math.random() * filteredColors.length)];
  };

  // Card animation effect (normal speed always)
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
      Math.floor(Math.random() * 800) + 1200 // Normal speed: 1200-2000ms
    );
    
    // Clean up on unmount or when dependencies change
    return () => {
      window.clearInterval(intervalId);
    };
  }, [cardColor, index]);

  // Button animation effect (speed varies with hover)
  useEffect(() => {
    // Initialize with a different color than the card
    if (!buttonColor) {
      const startIndex = (index + 3) % discoColors.length;
      setButtonColor(discoColors[startIndex]);
      return; // Exit after initial setup to avoid immediate color change
    }
    
    const animateButton = () => {
      const newColor = getRandomColor(buttonColor);
      setButtonColor(newColor);
    };
    
    // Create the animation interval with speed based on hover state
    const intervalSpeed = isButtonHovered 
      ? Math.floor(Math.random() * 100) + 100 // Super fast: 100-200ms
      : Math.floor(Math.random() * 800) + 1200; // Normal: 1200-2000ms
    
    const intervalId = window.setInterval(animateButton, intervalSpeed);
    
    // Clean up on unmount or when dependencies change
    return () => {
      window.clearInterval(intervalId);
    };
  }, [buttonColor, isButtonHovered, index]);

  return (
    <div
      className="w-[340px] h-[300px] relative bg-[#D9D9D9] rounded-[10px] max-md:mb-5 max-sm:w-full transition-all duration-800"
      style={{
        boxShadow: cardColor ? `0px 4px 30px 10px ${cardColor}` : undefined
      }}
    >
      <div className="px-[41px] py-[30px]">
        <div className="text-xl text-[#1E1E1E] mb-[5px]">{title}</div>
        <div className="text-sm text-[#1E1E1E] mb-[5px]">{description}</div>
        <div className="text-lg text-[#1E1E1E] mb-[5px] font-medium">${price.toFixed(2)}</div>
        <div className="text-sm text-[#1E1E1E] mb-[5px]">at {retailer}</div>
        <div className={`text-sm font-medium ${inStock ? "text-green-600" : "text-red-600"}`}>
          {inStock ? "In Stock" : "Out of Stock"}
        </div>
      </div>
      <button
        onClick={() => {}}
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

// Recent release component
const RecentRelease = ({ name, releaseDate, description, popularity }) => (
  <div className="flex border-b border-gray-200 py-4 last:border-0">
    <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
      <span className="text-xs text-gray-500">Image</span>
    </div>
    <div className="ml-4 flex-1">
      <div className="flex justify-between">
        <h3 className="font-medium">{name}</h3>
        <span className="text-xs text-gray-600">Released: {releaseDate}</span>
      </div>
      <p className="text-sm text-gray-700 mt-1">{description}</p>
      <div className="flex items-center mt-2">
        <span className="text-xs text-gray-600 mr-2">Popularity:</span>
        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full" 
            style={{ width: `${popularity}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-600 ml-2">{popularity}%</span>
      </div>
    </div>
  </div>
);

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(true);
  
  const featuredProducts = [
    {
      title: "Scarlet & Violet Twilight Masquerade Booster Box",
      description: "36 booster packs with 10 cards each from the latest expansion.",
      price: 149.99,
      retailer: "Pokemon Center",
      inStock: true
    },
    {
      title: "Pokemon TCG: Charizard ex Premium Collection",
      description: "Features Charizard ex foil promo card, oversized card, and 6 booster packs.",
      price: 39.99,
      retailer: "Target",
      inStock: false
    },
    {
      title: "Paldean Fates Elite Trainer Box",
      description: "Contains 10 booster packs, 65 card sleeves, and various accessories.",
      price: 49.99,
      retailer: "Walmart",
      inStock: true
    }
  ];
  
  const recentReleases = [
    {
      name: "Twilight Masquerade",
      releaseDate: "February 15, 2025",
      description: "Introducing new Legendary Pokemon and ex mechanics with a focus on Psychic and Ghost types.",
      popularity: 85
    },
    {
      name: "Paldean Fates",
      releaseDate: "January 10, 2025",
      description: "Special shiny collection featuring Paradox Pokemon and Terastal phenomenon.",
      popularity: 92
    },
    {
      name: "Temporal Forces",
      releaseDate: "December 5, 2024",
      description: "Expanded support for competitive archetypes with new Trainer cards and strategies.",
      popularity: 78
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        {/* Main content with filters at the top */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-2xl font-bold mb-2">Pokemon TCG Products</h1>
          <p className="text-gray-700 mb-6">
            Find all Pokemon TCG products with real-time stock information from major retailers. We track booster boxes, elite trainer boxes, special collections, and more.
          </p>
          
          {/* Search and sort bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="w-full md:w-auto">
              <Input 
                placeholder="Search all products..." 
                className="max-w-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="sortBy" className="whitespace-nowrap">Sort by:</Label>
              <Select defaultValue="relevance">
                <SelectTrigger id="sortBy" className="w-40">
                  <SelectValue placeholder="Relevance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filters section at the top */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                {filtersVisible ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {filtersVisible && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Product Type */}
                  <div>
                    <h3 className="font-medium mb-2">Product Type</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="boosterBox" />
                        <Label htmlFor="boosterBox" className="font-normal text-sm">Booster Box</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="eliteTrainer" />
                        <Label htmlFor="eliteTrainer" className="font-normal text-sm">Elite Trainer Box</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="specialCollection" />
                        <Label htmlFor="specialCollection" className="font-normal text-sm">Special Collection</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="boosterPack" />
                        <Label htmlFor="boosterPack" className="font-normal text-sm">Booster Pack</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="deck" />
                        <Label htmlFor="deck" className="font-normal text-sm">Theme/Battle Deck</Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Retailer */}
                  <div>
                    <h3 className="font-medium mb-2">Retailer</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="pokemonCenter" />
                        <Label htmlFor="pokemonCenter" className="font-normal text-sm">Pokemon Center</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="target" />
                        <Label htmlFor="target" className="font-normal text-sm">Target</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="walmart" />
                        <Label htmlFor="walmart" className="font-normal text-sm">Walmart</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="bestBuy" />
                        <Label htmlFor="bestBuy" className="font-normal text-sm">Best Buy</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="gamestop" />
                        <Label htmlFor="gamestop" className="font-normal text-sm">GameStop</Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Set and Price Range */}
                  <div>
                    <h3 className="font-medium mb-2">Set</h3>
                    <Select>
                      <SelectTrigger className="mb-4">
                        <SelectValue placeholder="Select a set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sets</SelectItem>
                        <SelectItem value="twilight-masquerade">Twilight Masquerade</SelectItem>
                        <SelectItem value="paldean-fates">Paldean Fates</SelectItem>
                        <SelectItem value="temporal-forces">Temporal Forces</SelectItem>
                        <SelectItem value="paradox-rift">Paradox Rift</SelectItem>
                        <SelectItem value="scarlet-violet">Scarlet & Violet</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <h3 className="font-medium mb-2 mt-4">Price Range</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minPrice" className="text-xs">Min</Label>
                        <Input id="minPrice" placeholder="$0" />
                      </div>
                      <div>
                        <Label htmlFor="maxPrice" className="text-xs">Max</Label>
                        <Input id="maxPrice" placeholder="$200" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Availability and Apply Filters */}
                  <div>
                    <h3 className="font-medium mb-2">Availability</h3>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="inStock" defaultChecked />
                        <Label htmlFor="inStock" className="font-normal text-sm">In Stock</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="outOfStock" />
                        <Label htmlFor="outOfStock" className="font-normal text-sm">Out of Stock</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="preOrder" />
                        <Label htmlFor="preOrder" className="font-normal text-sm">Pre-Order Available</Label>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1">Apply Filters</Button>
                      <Button variant="outline">Reset</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
            
          <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
          <div className="flex justify-center gap-[19px] max-md:flex-col max-md:items-center mb-8">
            {featuredProducts.map((product, index) => (
              <div key={index}>
                <FeaturedProduct {...product} index={index} />
              </div>
            ))}
          </div>
          
          {/* Advertisement between content sections */}
          <div className="my-8 p-6 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-2">Advertisement</p>
            <div className="h-24 flex items-center justify-center border border-dashed border-gray-400">
              <p className="text-gray-500">Google AdSense Banner (728×90)</p>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Recent Set Releases</h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="space-y-2">
              {recentReleases.map((release, index) => (
                <RecentRelease key={index} {...release} />
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline">View All Sets</Button>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">All Products</h2>
          <p className="text-gray-700 mb-6">
            Below are all Pokemon products currently tracked. Products shown as in-stock have been verified within the last 15 minutes.
          </p>
          
          <CardGrid />
          
          <div className="mt-8 flex justify-center">
            <Button>Load More Products</Button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">About Pokemon TCG Product Tracking</h2>
          <p className="text-gray-700 mb-4">
            The Pokemon Trading Card Game continues to be one of the most popular collectible card games worldwide. Due to high demand, many products quickly sell out at major retailers, making it difficult for collectors and players to find items at retail prices.
          </p>
          <p className="text-gray-700 mb-4">
            Our real-time inventory tracking system continuously monitors stock levels at Pokemon Center, Target, Walmart, Best Buy, GameStop, and dozens of other retailers to provide you with the most up-to-date information on product availability.
          </p>
          <p className="text-gray-700 mb-4">
            We check inventory multiple times per minute for high-demand products, ensuring you're among the first to know when restocks happen. For users who create a free account, we offer customizable alerts via email, text message, or push notification when specific products come back in stock.
          </p>
          <p className="text-gray-700">
            While we strive for 100% accuracy, inventory systems can sometimes experience delays. We recommend acting quickly when you receive an in-stock notification, as popular products may sell out within minutes.
          </p>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default ProductsPage;
