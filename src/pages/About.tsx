
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useMetaTags } from "@/hooks/use-meta-tags";
import EmptyStateHandler from "@/components/ui/empty-state-handler";
import { Separator } from "@/components/ui/separator";

const AboutPage = () => {
  // Add meta tags for SEO and AdSense compliance
  useMetaTags({
    title: "About TCG Updates | Our Mission & Story",
    description: "Learn about TCG Updates' mission to keep the trading card game community informed with the latest news, inventory tracking, and market insights.",
    keywords: "TCG news, Pokemon cards, MTG, Yu-Gi-Oh, trading card games, in-stock alerts, market tracking, card collecting",
    ogTitle: "About TCG Updates | News, Inventory & Market Tracking",
    ogDescription: "Discover how TCG Updates helps trading card game enthusiasts stay informed, find products, and track market trends."
  });

  const [contentLoaded, setContentLoaded] = React.useState(false);
  
  // Simulate loading state for demonstration
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setContentLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <EmptyStateHandler
        isLoading={!contentLoaded}
        hasItems={true}
        loadingComponent={<div className="p-8 text-center">Loading about page content...</div>}
        emptyComponent={<div className="p-8 text-center">Content currently unavailable.</div>}
      >
        <div className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h1 className="text-3xl font-bold mb-6">About TCG Updates</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
            <Separator className="h-[2px] bg-red-500 mb-4" />
            <p className="text-gray-700 mb-4">
              TCG Updates was created with a mission to serve the trading card game community in three key ways: providing breaking news and updates, helping collectors find products at retail prices, and offering comprehensive market tracking and analysis.
            </p>
            <p className="text-gray-700 mb-4">
              In today's dynamic TCG market, staying informed is crucial. We believe everyone should have access to timely news, fair product availability, and accurate market data to make informed collecting decisions.
            </p>
            <p className="text-gray-700 mb-4">
              By delivering daily updates across news, inventory tracking, and market analysis, we help create a more connected and resourceful community for all TCG enthusiasts.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">Our Story</h2>
            <Separator className="h-[2px] bg-red-500 mb-4" />
            <p className="text-gray-700 mb-4">
              TCG Updates began in early 2024 during a period of unprecedented growth in the trading card game market. As lifelong TCG enthusiasts ourselves, we recognized the need for a comprehensive platform that combined news, inventory tracking, and market analysis.
            </p>
            <p className="text-gray-700 mb-4">
              What started as a simple product tracker quickly evolved into a hub for news, market trends, and card set information. Our community has grown through word of mouth as collectors, players, and investors share their success stories of finding products, staying informed, and making smart collecting decisions.
            </p>
            <p className="text-gray-700 mb-4">
              Today, we cover dozens of retailers and multiple card games including Pokémon, Magic: The Gathering, Yu-Gi-Oh!, and Disney Lorcana. We bring you breaking news, monitor inventory daily, and provide detailed market analysis on graded cards and sealed products.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">What We Offer</h2>
            <Separator className="h-[2px] bg-red-500 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">1. Breaking News & Updates</h3>
                <p className="text-gray-700">
                  Stay informed with the latest announcements, set releases, tournament results, and market trends across all major trading card games.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">2. Inventory Tracking</h3>
                <p className="text-gray-700">
                  We monitor stock levels at major retailers, providing real-time updates and notifications when products become available at retail prices.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">3. Market Analysis</h3>
                <p className="text-gray-700">
                  Track market values of graded cards, sealed products, and trending items. Our PSA card database helps you make informed investment decisions.
                </p>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">Our TCG Coverage</h2>
            <Separator className="h-[2px] bg-red-500 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">Pokémon TCG</h3>
                <p className="text-gray-700 mb-4">
                  Comprehensive coverage of all Pokémon TCG releases, from vintage WOTC sets to the latest Scarlet & Violet expansions. We track booster boxes, Elite Trainer Boxes, special collections, and individual cards.
                </p>
                <Link to="/sets" className="text-blue-600 hover:underline">
                  Browse Pokémon Sets →
                </Link>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">Magic: The Gathering</h3>
                <p className="text-gray-700 mb-4">
                  Stay up-to-date with Standard, Modern, and Commander formats. Our MTG coverage includes set releases, Secret Lairs, and valuable singles tracking.
                </p>
                <Link to="/sets" className="text-blue-600 hover:underline">
                  Browse MTG Sets →
                </Link>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">Yu-Gi-Oh!</h3>
                <p className="text-gray-700 mb-4">
                  From core sets to structure decks and tournament staples, our Yu-Gi-Oh! coverage helps you stay competitive and informed about the ever-evolving meta.
                </p>
                <Link to="/sets" className="text-blue-600 hover:underline">
                  Browse Yu-Gi-Oh! Sets →
                </Link>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">Disney Lorcana</h3>
                <p className="text-gray-700 mb-4">
                  As the newest major TCG on the market, we provide extensive coverage of Disney Lorcana releases, helping collectors navigate this exciting new game.
                </p>
                <Link to="/sets" className="text-blue-600 hover:underline">
                  Browse Lorcana Sets →
                </Link>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
            <Separator className="h-[2px] bg-red-500 mb-4" />
            <p className="text-gray-700 mb-6">
              Have questions, suggestions, or want to partner with us? We'd love to hear from you!
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@tcgupdates.com" className="text-blue-600 hover:underline">info@tcgupdates.com</a></p>
              <p className="mb-2"><strong>Contact Form:</strong> <Link to="/contact" className="text-blue-600 hover:underline">Fill out our contact form</Link></p>
            </div>
            
            <div className="mt-8">
              <Button asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </section>
        </div>
      </EmptyStateHandler>
    </Layout>
  );
};

export default AboutPage;
