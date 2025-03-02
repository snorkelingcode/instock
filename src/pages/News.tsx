import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Navigation component from other pages
const Navigation = () => (
  <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
    <Link to="/" className="text-xl font-bold">Pokemon In-Stock Tracker</Link>
    
    <div className="hidden md:flex space-x-6">
      <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
      <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
      <Link to="/news" className="text-gray-700 hover:text-blue-600 font-medium">News</Link>
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

// Single news article preview
const NewsPreview = ({ title, date, category, excerpt, image, url, featured = false }) => (
  <Card className={`overflow-hidden transition-all ${featured ? 'border-blue-300 shadow-md' : ''}`}>
    <div className="aspect-video bg-gray-200 flex items-center justify-center">
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-500">News Image</span>
      )}
    </div>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start mb-1">
        <Badge variant={category === 'Product News' ? 'default' : category === 'Release Dates' ? 'secondary' : 'outline'}>
          {category}
        </Badge>
        {featured && <Badge className="bg-blue-500">Featured</Badge>}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="text-gray-500">{date}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700">{excerpt}</p>
    </CardContent>
    <CardFooter>
      <Button asChild variant="outline" size="sm">
        <Link to={url || "#"}>Read Full Article</Link>
      </Button>
    </CardFooter>
  </Card>
);

// Featured news article
const FeaturedNews = ({ title, date, category, content, image, url }) => (
  <div className="bg-white rounded-lg overflow-hidden shadow-md border border-blue-200 mb-8">
    <div className="aspect-video bg-gray-200 flex items-center justify-center">
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-500">Featured News Image</span>
      )}
    </div>
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="default">{category}</Badge>
        <Badge className="bg-blue-500">Featured Story</Badge>
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{date}</p>
      <div className="prose max-w-none mb-6">
        <p className="text-gray-700">{content}</p>
      </div>
      <Button asChild>
        <Link to={url || "#"}>Read Full Article</Link>
      </Button>
    </div>
  </div>
);

const NewsPage = () => {
  // Sample news data
  const featuredArticle = {
    title: "Twilight Masquerade Set Revealed: New Trainer Gallery and Ancient Pokemon",
    date: "March 1, 2025",
    category: "Product News",
    content: "The Pokemon Company has officially unveiled the next major expansion for the Pokemon Trading Card Game: Twilight Masquerade. Set to release on May 10, 2025, this expansion introduces over 190 new cards, including 15 Pokemon ex, 3 Ace Spec Trainer cards, and a special Trainer Gallery subset featuring alternate-art Pokemon paired with popular characters from the games. The set also introduces Ancient Pokemon as a new mechanic, with special abilities that activate when specific energy combinations are attached. Pre-orders are expected to open at major retailers in early April, with Elite Trainer Boxes, booster boxes, and special collections already announced.",
    url: "/news/twilight-masquerade-reveal"
  };
  
  const recentNews = [
    {
      title: "Target Announces New Pokemon TCG Restock Policy",
      date: "February 27, 2025",
      category: "Retailer Updates",
      excerpt: "Target has announced changes to their Pokemon TCG restocking process to ensure fair distribution and combat scalping. Starting March 15, purchases of certain high-demand products will be limited to 2 per customer, with select items moving behind customer service counters.",
      url: "/news/target-restock-policy"
    },
    {
      title: "Paldean Fates Restock Coming to Pokemon Center Next Week",
      date: "February 25, 2025",
      category: "Restocks",
      excerpt: "The Pokemon Company has confirmed that Pokemon Center will be restocking Paldean Fates Elite Trainer Boxes and booster boxes next Tuesday at 10am EST. This marks the third restock since the popular set sold out within minutes of its initial release.",
      url: "/news/paldean-fates-restock"
    },
    {
      title: "Pokemon TCG Championship Series 2025 Dates Announced",
      date: "February 20, 2025",
      category: "Events",
      excerpt: "The Pokemon Company International has revealed dates for the 2025 Championship Series, with Regional Championships scheduled across North America, Europe, Latin America, and Oceania. The World Championships will be held in Tokyo, Japan from August 15-17, 2025.",
      url: "/news/championship-series-2025"
    },
    {
      title: "Upcoming 151 Set: What We Know So Far",
      date: "February 18, 2025",
      category: "Release Dates",
      excerpt: "The highly anticipated Pokemon TCG 151 set is coming soon. The set will focus on the original 151 Pokemon with modern card designs and mechanics. Here's everything we know about the release date, card list, and where to pre-order.",
      url: "/news/upcoming-151-set"
    },
    {
      title: "Pokemon GO Crossover Cards Coming to TCG in Summer 2025",
      date: "February 15, 2025",
      category: "Product News",
      excerpt: "The Pokemon Company has announced a new collaboration between Pokemon GO and the TCG, featuring unique cards that showcase Pokemon with GO-inspired artwork and special mechanics related to the mobile game.",
      url: "/news/pokemon-go-tcg-crossover"
    },
    {
      title: "Walmart Expanding Trading Card Section in Stores Nationwide",
      date: "February 10, 2025",
      category: "Retailer Updates",
      excerpt: "Walmart has announced plans to expand its trading card sections in stores nationwide, with dedicated space for Pokemon TCG products. The expansion includes better security measures and an improved display system.",
      url: "/news/walmart-card-section-expansion"
    }
  ];

  const marketAnalysis = [
    {
      title: "Paldean
