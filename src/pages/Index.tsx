import React, { useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { CardGrid } from "@/components/landing/CardGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Navigation component used across pages
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col">
      <div className="flex justify-between items-center w-full">
        <Link to="/" className="text-xl font-bold">TCG In-Stock Tracker</Link>
        
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
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
          <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium py-2">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600 py-2">Products</Link>
          <Link to="/news" className="text-gray-700 hover:text-blue-600 py-2">News</Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600 py-2">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600 py-2">Contact</Link>
        </div>
      )}
    </nav>
  );
};

// Site introduction with real content
const SiteIntro = () => (
  <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-4">Welcome to TCG In-Stock Tracker</h2>
    <p className="text-gray-700 mb-4">
      Finding your favorite trading card products shouldn't be a challenge in 2025. Our mission is to help collectors and players
      locate in-stock trading cards, boxes, and accessories from all major retailers in one convenient place.
    </p>
    <p className="text-gray-700 mb-4">
      We track inventory from Pokemon Center, Target, Walmart, GameStop, and other retailers in real-time,
      so you never miss a restock or new release. We check for product availability multiple times per day
      for high-demand items and provides accurate, up-to-date information on what's currently available at retail prices.
    </p>
    <div className="flex gap-4 mt-6">
      <Button asChild>
        <Link to="/about">Learn More</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/products">Browse All Products</Link>
      </Button>
    </div>
  </section>
);


// Improved AdBanner component with better placement
const AdBanner = () => (
  <section className="bg-white p-6 rounded-lg mb-12 text-center">
    <p className="text-sm text-gray-500 mb-2">Advertisement</p>
    <div className="h-24 flex items-center justify-center border border-dashed border-gray-400">
      <p className="text-gray-500">Google AdSense Banner (728×90)</p>
    </div>
  </section>
);

// How it works section with real content
const HowItWorksSection = () => (
  <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-6">How TCG In-Stock Tracker Works</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center">
        <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-600 text-2xl font-bold">1</span>
        </div>
        <h3 className="text-lg font-medium mb-2">Data Responsible Tracking</h3>
        <p className="text-gray-700">
          We constantly monitor inventory manually at major retailers. For high-demand products, we check stock multiple times per day to ensure you're getting the most up-to-date information.
        </p>
      </div>
      
      <div className="text-center">
        <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-600 text-2xl font-bold">2</span>
        </div>
        <h3 className="text-lg font-medium mb-2">Instant Alerts</h3>
        <p className="text-gray-700">
          Subscribe to set up alerts for specific products, retailers, or product categories. Receive notifications via email, text message, or push notification when items come back in stock.
        </p>
      </div>
      
      <div className="text-center">
        <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-600 text-2xl font-bold">3</span>
        </div>
        <h3 className="text-lg font-medium mb-2">Direct Links</h3>
        <p className="text-gray-700">
          We provide direct links to product pages so you can quickly access items when they restock. Our listings include pricing, retailer information, and any purchase restrictions.
        </p>
      </div>
    </div>
  </section>
);

// Footer component with real content
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
          <li><Link to="/products" className="text-gray-600 hover:text-blue-600">Products</Link></li>
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

const Index = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    metaDescription.content = "Find TCG products in stock at major retailers. Track inventory for Pokemon Center, Target, Walmart, and more.";
    document.head.appendChild(metaDescription);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(metaDescription);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']" role="main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        <Hero />
        
        <SiteIntro />
        
        <AdBanner />
        
        <HowItWorksSection />
        
        <AdBanner />
        
        <h2 className="text-2xl font-semibold mb-6">Latest In-Stock Products</h2>
        <CardGrid />
        
        <AdBanner />
        
        <NewsSection />
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
