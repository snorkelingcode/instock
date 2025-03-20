
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import AdContainer from "@/components/ads/AdContainer";
import { useMetaTags } from "@/hooks/use-meta-tags";
import EmptyStateHandler from "@/components/ui/empty-state-handler";

const AboutPage = () => {
  // Add meta tags for SEO and AdSense compliance
  useMetaTags({
    title: "About TCG Updates | Our Mission & Story",
    description: "Learn about TCG Updates' mission to keep the trading card game community informed with the latest news, inventory tracking, and creative DIY accessories.",
    keywords: "TCG news, Pokemon cards, MTG, Yu-Gi-Oh, trading card games, in-stock alerts, DIY accessories, card collecting",
    ogTitle: "About TCG Updates | News, Inventory & Accessories",
    ogDescription: "Discover how TCG Updates helps trading card game enthusiasts stay informed, find products, and enhance their collections with creative solutions."
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
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              TCG Updates was created with a mission to serve the trading card game community in three key ways: providing breaking news and updates, helping collectors find products at retail prices, and inspiring creativity through DIY accessories and collection solutions.
            </p>
            <p className="text-gray-700 mb-4">
              In today's dynamic TCG market, staying informed is crucial. We believe everyone should have access to timely news, fair product availability, and innovative ways to enhance their collecting experience.
            </p>
            <p className="text-gray-700 mb-4">
              By delivering daily updates across news, inventory tracking, and creative projects, we help create a more connected and resourceful community for all TCG enthusiasts.
            </p>
          </section>
          
          {/* Place ad after meaningful content */}
          <AdContainer 
            className="my-8" 
            adSlot="auto" 
            adFormat="horizontal" 
            fullWidth={true} 
          />
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              TCG Updates began in early 2024 during a period of unprecedented growth in the trading card game market. As lifelong TCG enthusiasts ourselves, we recognized the need for a comprehensive platform that went beyond just tracking inventory.
            </p>
            <p className="text-gray-700 mb-4">
              What started as a simple product tracker quickly evolved into a hub for news, market trends, and DIY projects. Our community has grown through word of mouth as collectors, players, and hobbyists share their success stories of finding products, staying informed, and creating unique accessories for their collections.
            </p>
            <p className="text-gray-700 mb-4">
              Today, we cover dozens of retailers and multiple card games including Pokémon, Magic: The Gathering, Yu-Gi-Oh!, and Disney Lorcana. We bring you breaking news, monitor inventory daily, and showcase creative ways to store, display, and transport your valuable collections.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
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
                  We manually monitor stock levels at major retailers, providing real-time updates and notifications when products become available at retail prices.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">3. DIY Accessories & Guides</h3>
                <p className="text-gray-700">
                  Explore our guides for creating custom card storage, display cases, and accessories to enhance your collection. From beginner-friendly projects to advanced builds.
                </p>
              </div>
            </div>
          </section>
          
          {/* Place ad after meaningful content */}
          <AdContainer 
            className="my-8" 
            adSlot="auto" 
            adFormat="rectangle" 
            fullWidth={true} 
          />
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
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
