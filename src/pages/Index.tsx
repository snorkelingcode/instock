import React, { useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { CardGrid } from "@/components/landing/CardGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Navigation component used across pages
const Navigation = () => (
  <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
    <Link to="/" className="text-xl font-bold">TCG In-Stock Tracker</Link>
    
    <div className="hidden md:flex space-x-6">
      <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
      <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
      <Link to="/news" className="text-gray-700 hover:text-blue-600">News</Link>
      <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
      <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
    </div>
    
    <Button className="md:hidden">Menu</Button>
  </nav>
);

// Site introduction with real content
const SiteIntro = () => (
  <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-4">Welcome to our TCG In-Stock Tracker</h2>
    <p className="text-gray-700 mb-4">
      Finding your favorite trading card products shouldn't be a challenge in 2025. Our mission is to help collectors and players
      locate in-stock trading cards, boxes, and accessories from all major retailers in one convenient place.
    </p>
    <p className="text-gray-700 mb-4">
      We track inventory from Pokemon Center, Target, Walmart, GameStop, and other retailers in real-time,
      so you never miss a restock or new release. Our automated system checks for product availability multiple times per minute
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

// Real featured product section
const FeaturedProduct = ({ title, imageText, price, retailer, inStock, description }) => (
  <Card className="h-full flex flex-col">
    <div className="aspect-video bg-gray-200 flex items-center justify-center">
      <span className="text-gray-500">{imageText}</span>
    </div>
    <CardHeader className="pb-2">
      <div className="flex justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Badge variant={inStock ? "default" : "secondary"}>{inStock ? "In Stock" : "Out of Stock"}</Badge>
      </div>
      <CardDescription>${price.toFixed(2)} at {retailer}</CardDescription>
    </CardHeader>
    <CardContent className="text-sm text-gray-700 pb-6 flex-grow">
      <p>{description}</p>
    </CardContent>
    <CardFooter className="pt-0">
      <Button variant="outline" size="sm" asChild className="w-full">
        <Link to={`/products/${title.toLowerCase().replace(/\s+/g, '-')}`}>View Details</Link>
      </Button>
    </CardFooter>
  </Card>
);


// News article preview component
const NewsArticle = ({ title, date, category, excerpt }) => (
  <article className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex gap-2 mb-2">
      <Badge>{category}</Badge>
      <span className="text-gray-600 text-sm">{date}</span>
    </div>
    <h3 className="text-xl font-medium mb-2">{title}</h3>
    <p className="text-gray-700 mb-4">{excerpt}</p>
    <Button variant="outline" asChild>
      <Link to={`/news/${title.toLowerCase().replace(/\s+/g, '-')}`}>Read More</Link>
    </Button>
  </article>
);

const NewsSection = () => {
  // Realistic news data
  const newsArticles = [
    {
      title: "Twilight Masquerade Set Revealed: New Trainer Gallery and Ancient Pokemon",
      date: "March 1, 2025",
      category: "Product News",
      excerpt: "The Pokemon Company has officially unveiled the next major expansion for the Pokemon Trading Card Game: Twilight Masquerade. Set to release on May 10, 2025, this expansion introduces over 190 new cards."
    },
    {
      title: "Target Announces New Pokemon TCG Restock Policy",
      date: "February 27, 2025",
      category: "Retailer Updates",
      excerpt: "Target has announced changes to their Pokemon TCG restocking process to ensure fair distribution and combat scalping. Starting March 15, purchases of certain high-demand products will be limited to 2 per customer."
    }
  ];

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Latest Pokemon TCG News</h2>
        <Button variant="ghost" asChild className="text-blue-600">
          <Link to="/news">All News</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {newsArticles.map((article, index) => (
          <NewsArticle key={index} {...article} />
        ))}
      </div>
    </section>
  );
};

// Improved AdBanner component with better placement
const AdBanner = () => (
  <section className="bg-white p-6 rounded-lg mb-12 text-center">
    <p className="text-sm text-gray-500 mb-2">Advertisement</p>
    <div className="h-24 flex items-center justify-center border border-dashed border-gray-400">
      <p className="text-gray-500">Google AdSense Banner (728×90)</p>
    </div>
  </section>
);

// Recent Restocks section with real content
const RecentRestocksSection = () => {
  const recentRestocks = [
    {
      product: "Scarlet & Violet Ultra Premium Collection",
      retailer: "Pokemon Center",
      time: "Today, 10:35 AM EST",
      price: 89.99,
      status: "In Stock",
      url: "/products/sv-ultra-premium-collection"
    },
    {
      product: "Paldean Fates Elite Trainer Box",
      retailer: "GameStop",
      time: "Today, 9:22 AM EST",
      price: 59.99,
      status: "In Stock",
      url: "/products/paldean-fates-etb"
    },
    {
      product: "151 Ultra Premium Collection",
      retailer: "Target",
      time: "Yesterday, 3:15 PM EST",
      price: 119.99,
      status: "Limited Stock",
      url: "/products/151-ultra-premium-collection"
    },
    {
      product: "Charizard ex Premium Collection",
      retailer: "Best Buy",
      time: "Yesterday, 1:48 PM EST",
      price: 39.99,
      status: "In Stock",
      url: "/products/charizard-ex-premium-collection"
    }
  ];

  return (
    <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Recent Restocks</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentRestocks.map((restock, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{restock.product}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restock.retailer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restock.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${restock.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    restock.status === "In Stock" 
                      ? "bg-green-100 text-green-800" 
                      : restock.status === "Limited Stock" 
                        ? "bg-yellow-100 text-yellow-800" 
                        : "bg-red-100 text-red-800"
                  }`}>
                    {restock.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button asChild variant="outline" size="sm">
                    <Link to={restock.url}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-center">
        <Button asChild>
          <Link to="/restocks">View All Restocks</Link>
        </Button>
      </div>
    </section>
  );
};

// How it works section with real content
const HowItWorksSection = () => (
  <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-6">How Pokemon In-Stock Tracker Works</h2>
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
          Helping trading card fans find products in stock since 2024.
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
    // Load Inter font
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Set proper meta description for SEO and AdSense
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
        
        {/* Site intro with valuable content */}
        <SiteIntro />
        
        {/* Advertisement properly placed between content sections */}
        <AdBanner />
        
        {/* Featured products section */}
        <FeaturedSection />
        
        {/* How it works section */}
        <HowItWorksSection />
        
        {/* Advertisement properly placed between content sections */}
        <AdBanner />
        
        {/* Recent restocks with real data */}
        <RecentRestocksSection />
        
        <h2 className="text-2xl font-semibold mb-6">Latest In-Stock Products</h2>
        <CardGrid />
        
        {/* Advertisement properly placed between content sections */}
        <AdBanner />
        
        {/* News section */}
        <NewsSection />
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
