
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
    title: "About TCG In-Stock Tracker | Our Mission & Story",
    description: "Learn about TCG In-Stock Tracker's mission to help Pokemon fans find products at retail prices without the frustration of constant sellouts and scalping.",
    keywords: "TCG tracker, Pokemon cards, trading card games, in-stock alerts, retail prices, card collecting",
    ogTitle: "About TCG In-Stock Tracker | Finding Cards at Retail",
    ogDescription: "Discover how TCG In-Stock Tracker helps level the playing field for collectors by providing daily stock updates from major retailers."
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
          <h1 className="text-3xl font-bold mb-6">About TCG In-Stock Tracker</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              TCG In-Stock Tracker was created with a simple mission: to help Pokemon fans find the products they love without the frustration of constant sellouts and scalping.
            </p>
            <p className="text-gray-700 mb-4">
              In today's TCG market, finding products at retail prices can be challenging. Popular sets sell out quickly, and many collectors miss out on new releases. We believe everyone should have a fair chance to enjoy this hobby without paying inflated prices on the secondary market.
            </p>
            <p className="text-gray-700 mb-4">
              By providing daily stock updates from major retailers, we help level the playing field and make the hobby more accessible to all fans, whether you're a competitive player, collector, or parent looking for a gift.
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
             TCG In-Stock Tracker began in early 2024 during a period of unprecedented demand for Pokemon cards. As lifelong Pokemon fans ourselves, we experienced firsthand the frustration of missing out on new releases and seeing prices skyrocket on the secondary market.
            </p>
            <p className="text-gray-700 mb-4">
              What started as a simple idea quickly grew into a comprehensive website serving hundreds of Pokemon enthusiasts daily. Our community has grown through word of mouth as collectors share their success stories of finally finding products at MSRP thanks to our alerts.
            </p>
            <p className="text-gray-700 mb-4">
              Today, we track inventory across dozens of retailers including Pokemon Center, Target, Walmart, Best Buy, GameStop, and many local game stores that have partnered with us. We manually check for restocks daily, ensuring you never miss an opportunity to add to your collection.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">1. Daily Tracking</h3>
                <p className="text-gray-700">
                  We manually monitor inventory across major retailers, due to many sites having privacy policies that makes webscraping unethical. We check for restocks multiple times per day on high-demand items.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">2. Real-Time Updates</h3>
                <p className="text-gray-700">
                  When a product comes back in stock, we display it on our website. For subscribed users, we send instant notifications via email, SMS, or push notifications based on your preferences.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-medium mb-3">3. Direct Links</h3>
                <p className="text-gray-700">
                  We provide direct links to product pages, allowing you to skip the search process and checkout quickly before items sell out again. All services on this site are 100% free, as this site was built to help people, not take from them.
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
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@pokemoninstocktracker.com" className="text-blue-600 hover:underline">info@pokemoninstocktracker.com</a></p>
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
