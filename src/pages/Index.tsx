import React, { useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { CardGrid } from "@/components/landing/CardGrid";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// New components for enhanced content
const SiteIntro = () => (
  <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-4">Welcome to Pokemon In-Stock Tracker</h2>
    <p className="text-gray-700 mb-4">
      Finding your favorite Pokemon products shouldn't be a challenge in 2025. Our mission is to help collectors and players
      locate in-stock Pokemon cards, boxes, and accessories from all major retailers in one convenient place.
    </p>
    <p className="text-gray-700 mb-4">
      We track inventory from Pokemon Center, Target, Walmart, GameStop, and other retailers in real-time,
      so you never miss a restock or new release.
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

const FeaturedSection = () => (
  <section className="mb-12">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">Featured Products</h2>
      <Button variant="ghost" asChild className="text-blue-600">
        <Link to="/products">View All</Link>
      </Button>
    </div>
    
    {/* This would be a specialized version of CardGrid with only featured items */}
    <div className="bg-white p-4 rounded-lg mb-4">
      <h3 className="font-medium mb-2">Featured section placeholder - replace with actual featured products</h3>
      <p className="text-gray-600">This section will display 3-5 featured or high-demand products.</p>
    </div>
  </section>
);

const NewsSection = () => (
  <section className="mb-12">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">Latest Pokemon TCG News</h2>
      <Button variant="ghost" asChild className="text-blue-600">
        <Link to="/news">All News</Link>
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-medium mb-2">Upcoming 151 Set: What We Know So Far</h3>
        <p className="text-gray-600 mb-3">March 1, 2025</p>
        <p className="text-gray-700 mb-4">
          The highly anticipated Pokemon TCG 151 set is coming soon. Here's everything we know about
          the release date, card list, and where to pre-order.
        </p>
        <Button variant="outline" asChild>
          <Link to="/news/upcoming-151-set">Read More</Link>
        </Button>
      </article>
      
      <article className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-medium mb-2">Target Announces New Pokemon TCG Restock Policy</h3>
        <p className="text-gray-600 mb-3">February 27, 2025</p>
        <p className="text-gray-700 mb-4">
          Target has announced changes to their Pokemon TCG restocking process to ensure fair 
          distribution and combat scalping. Here's what you need to know.
        </p>
        <Button variant="outline" asChild>
          <Link to="/news/target-restock-policy">Read More</Link>
        </Button>
      </article>
    </div>
  </section>
);

const AdBanner = () => (
  <section className="bg-gray-200 p-6 rounded-lg mb-12 text-center">
    <p className="text-gray-700">Advertisement</p>
    <div className="h-16 flex items-center justify-center border border-dashed border-gray-400">
      <p className="text-gray-500">Google AdSense Banner (728×90)</p>
    </div>
  </section>
);

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

const Navigation = () => (
  <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
    <Link to="/" className="text-xl font-bold">Pokemon In-Stock Tracker</Link>
    
    <div className="hidden md:flex space-x-6">
      <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
      <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
      <Link to="/news" className="text-gray-700 hover:text-blue-600">News</Link>
      <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
      <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
    </div>
    
    <Button className="md:hidden">Menu</Button>
  </nav>
);

const Index = () => {
  useEffect(() => {
    // Load Inter font
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Set proper meta description for SEO and AdSense
    const metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    metaDescription.content = "Find Pokemon TCG products in stock at major retailers. Track inventory for Pokemon Center, Target, Walmart, and more in real-time.";
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
        
        {/* Ad placement after hero section */}
        <AdBanner />
        
        <SiteIntro />
        <FeaturedSection />
        
        <h2 className="text-2xl font-semibold mb-6">Latest In-Stock Products</h2>
        <CardGrid />
        
        {/* Ad placement between content sections */}
        <AdBanner />
        
        <NewsSection />
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
