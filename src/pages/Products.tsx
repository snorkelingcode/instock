import React, { useState } from "react";
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

// Featured product component
const FeaturedProduct = ({ title, description, imageUrl, price, retailer, inStock }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-300">
    <div className="aspect-video bg-gray-200 rounded-md mb-4 flex items-center justify-center">
      <span className="text-gray-500">{imageUrl || "Product Image"}</span>
    </div>
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Featured</span>
    </div>
    <p className="text-gray-700 text-sm mb-3">{description}</p>
    <div className="flex justify-between items-center mb-3">
      <span className="font-medium">${price.toFixed(2)}</span>
      <span className="text-sm text-gray-600">at {retailer}</span>
    </div>
    <div className="flex justify-between items-center">
      <span className={`text-sm ${inStock ? "text-green-600" : "text-red-600"}`}>
        {inStock ? "In Stock" : "Out of Stock"}
      </span>
      <Button size="sm">View Listing</Button>
    </div>
  </div>
);

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
  const [filterExpanded, setFilterExpanded] = useState(true);
  
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
        
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Sidebar with filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilterExpanded(!filterExpanded)}
                >
                  {filterExpanded ? "Collapse" : "Expand"}
                </Button>
              </div>
              
              {filterExpanded && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="productSearch" className="mb-2 block">Search</Label>
                    <Input 
                      id="productSearch" 
                      placeholder="Search products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Product Type</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="boosterBox" />
                        <Label htmlFor="boosterBox" className="font-normal">Booster Box</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="eliteTrainer" />
                        <Label htmlFor="eliteTrainer" className="font-normal">Elite Trainer Box</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="specialCollection" />
                        <Label htmlFor="specialCollection" className="font-normal">Special Collection</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="boosterPack" />
                        <Label htmlFor="boosterPack" className="font-normal">Booster Pack</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="deck" />
                        <Label htmlFor="deck" className="font-normal">Theme/Battle Deck</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Retailer</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="pokemonCenter" />
                        <Label htmlFor="pokemonCenter" className="font-normal">Pokemon Center</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="target" />
                        <Label htmlFor="target" className="font-normal">Target</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="walmart" />
                        <Label htmlFor="walmart" className="font-normal">Walmart</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="bestBuy" />
                        <Label htmlFor="bestBuy" className="font-normal">Best Buy</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="gamestop" />
                        <Label htmlFor="gamestop" className="font-normal">GameStop</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Set</h3>
                    <Select>
                      <SelectTrigger>
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
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Price Range</h3>
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
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Availability</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="inStock" defaultChecked />
                        <Label htmlFor="inStock" className="font-normal">In Stock</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="outOfStock" />
                        <Label htmlFor="outOfStock" className="font-normal">Out of Stock</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="preOrder" />
                        <Label htmlFor="preOrder" className="font-normal">Pre-Order Available</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full">Apply Filters</Button>
                  <Button variant="outline" className="w-full mt-2">Reset</Button>
                </div>
              )}
            </div>
            
            {/* Advertisement in sidebar */}
            <div className="bg-gray-100 p-4 rounded-lg mt-8 text-center sticky top-96">
              <p className="text-sm text-gray-500 mb-2">Advertisement</p>
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-400">
                <p className="text-gray-500">Google AdSense (300×600)</p>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-w-0 overflow-x-hidden">
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h1 className="text-2xl font-bold mb-2">Pokemon TCG Products</h1>
              <p className="text-gray-700 mb-6">
                Find all Pokemon TCG products with real-time stock information from major retailers. We track booster boxes, elite trainer boxes, special collections, and more.
              </p>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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
              
              <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {featuredProducts.map((product, index) => (
                  <FeaturedProduct key={index} {...product} />
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
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default ProductsPage;
