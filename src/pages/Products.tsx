import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardGrid } from "@/components/landing/CardGrid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FeaturedProduct from "@/components/featured-product";

// Navigation component from other pages
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col">
      <div className="flex justify-between items-center w-full">
        <Link to="/" className="text-xl font-bold">TCG In-Stock Tracker</Link>
        
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium">Products</Link>
          <Link to="/news" className="text-gray-700 hover:text-blue-600">News</Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
        </div>
        
        <Button 
          className="md:hidden" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          Menu
        </Button>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden w-full mt-4 flex flex-col space-y-3 pt-3 border-t border-gray-200">
          <Link to="/" className="text-gray-700 hover:text-blue-600 py-2">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium py-2">Products</Link>
          <Link to="/news" className="text-gray-700 hover:text-blue-600 py-2">News</Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600 py-2">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600 py-2">Contact</Link>
        </div>
      )}
    </nav>
  );
};

// Footer component from other pages
const Footer = () => (
  <footer className="bg-white p-8 rounded-lg shadow-md mt-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="font-semibold mb-4">TCG In-Stock Tracker</h3>
        <p className="text-gray-600 mb-4">
          Helping degens find products in stock since 2024.
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

// Interface for product data
interface Product {
  id: number;
  product_line: string;
  product: string;
  source: string;
  price: number;
  listing_link: string;
  image_link?: string;
  in_stock?: boolean;
}

const ProductsPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true })
          .limit(3);

        if (error) {
          throw error;
        }

        setFeaturedProducts(data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        toast({
          title: "Error",
          description: "Failed to load featured products",
          variant: "destructive",
        });
        
        setFeaturedProducts([
          {
            id: 1,
            product_line: "Scarlet & Violet",
            product: "Twilight Masquerade Booster Box",
            source: "Pokemon Center",
            price: 149.99,
            listing_link: "",
            image_link: "",
            in_stock: true
          },
          {
            id: 2,
            product_line: "Pokemon TCG",
            product: "Charizard ex Premium Collection",
            source: "Target",
            price: 39.99,
            listing_link: "",
            image_link: "",
            in_stock: false
          },
          {
            id: 3,
            product_line: "Paldean Fates",
            product: "Elite Trainer Box",
            source: "Walmart",
            price: 49.99,
            listing_link: "",
            image_link: "",
            in_stock: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        {/* Main content */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-2xl font-bold mb-2">TCG Products</h1>
          <p className="text-gray-700 mb-6">
            Find all TCG products with real-time stock information from major retailers. We track booster boxes, elite trainer boxes, special collections, and more.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-pulse text-xl">Loading featured products...</div>
            </div>
          ) : (
            <div className="flex justify-between mb-8 max-md:flex-col max-md:items-center">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="md:mx-2">
                  <FeaturedProduct 
                    title={`${product.product_line} ${product.product}`}
                    description={`${product.product_line} ${product.product} available at ${product.source}`}
                    price={product.price}
                    retailer={product.source}
                    listingLink={product.listing_link}
                    imageLink={product.image_link}
                    index={index}
                  />
                </div>
              ))}
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-4 mt-12">All Products</h2>
          <p className="text-gray-700 mb-6">
            Below are all TCG products currently tracked. Products shown as in-stock have been verified within the last 15 minutes.
          </p>
          
          <CardGrid />
          
          <div className="mt-8 flex justify-center">
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">About TCG Product Tracking</h2>
          <p className="text-gray-700 mb-4">
            The Pokemon Trading Card Game continues to be one of the most popular collectible card games worldwide. Due to high demand, many products quickly sell out at major retailers, making it difficult for collectors and players to find items at retail prices.
          </p>
          <p className="text-gray-700 mb-4">
            We continuously monitor stock levels manually at Pokemon Center, Target, Walmart, Best Buy, GameStop, and dozens of other retailers to provide you with the most up-to-date information on product availability.
          </p>
          <p className="text-gray-700 mb-4">
            We check inventory multiple times per day for high-demand products, ensuring you're among the first to know when restocks happen. For users who create a free account, we offer customizable alerts via email, text message, or push notification when specific products come back in stock.
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
