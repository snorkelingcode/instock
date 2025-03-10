import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import NewsPreview from "@/components/news/NewsPreview";
import FeaturedNews from "@/components/news/FeaturedNews";
import RecentRelease from "@/components/news/RecentRelease";

const NewsPage = () => {
  const featuredArticle = {
    title: "Twilight Masquerade Set Revealed: New Trainer Gallery and Ancient Pokemon",
    date: "March 1, 2025",
    category: "Product News",
    content: "The Pokemon Company has officially unveiled the next major expansion for the Pokemon Trading Card Game: Twilight Masquerade. Set to release on May 10, 2025, this expansion introduces over 190 new cards, including 15 Pokemon ex, 3 Ace Spec Trainer cards, and a special Trainer Gallery subset featuring alternate-art Pokemon paired with popular characters from the games. The set also introduces Ancient Pokemon as a new mechanic, with special abilities that activate when specific energy combinations are attached. Pre-orders are expected to open at major retailers in early April, with Elite Trainer Boxes, booster boxes, and special collections already announced."
  };
  
  const recentNews = [
    {
      title: "Target Announces New Pokemon TCG Restock Policy",
      date: "February 27, 2025",
      category: "Retailer Updates",
      excerpt: "Target has announced changes to their Pokemon TCG restocking process to ensure fair distribution and combat scalping. Starting March 15, purchases of certain high-demand products will be limited to 2 per customer, with select items moving behind customer service counters."
    },
    {
      title: "Paldean Fates Restock Coming to Pokemon Center Next Week",
      date: "February 25, 2025",
      category: "Restocks",
      excerpt: "The Pokemon Company has confirmed that Pokemon Center will be restocking Paldean Fates Elite Trainer Boxes and booster boxes next Tuesday at 10am EST. This marks the third restock since the popular set sold out within minutes of its initial release."
    },
    {
      title: "Pokemon TCG Championship Series 2025 Dates Announced",
      date: "February 20, 2025",
      category: "Events",
      excerpt: "The Pokemon Company International has revealed dates for the 2025 Championship Series, with Regional Championships scheduled across North America, Europe, Latin America, and Oceania. The World Championships will be held in Tokyo, Japan from August 15-17, 2025."
    },
    {
      title: "Upcoming 151 Set: What We Know So Far",
      date: "February 18, 2025",
      category: "Release Dates",
      excerpt: "The highly anticipated Pokemon TCG 151 set is coming soon. The set will focus on the original 151 Pokemon with modern card designs and mechanics. Here's everything we know about the release date, card list, and where to pre-order."
    },
    {
      title: "Pokemon GO Crossover Cards Coming to TCG in Summer 2025",
      date: "February 15, 2025",
      category: "Product News",
      excerpt: "The Pokemon Company has announced a new collaboration between Pokemon GO and the TCG, featuring unique cards that showcase Pokemon with GO-inspired artwork and special mechanics related to the mobile game."
    },
    {
      title: "Walmart Expanding Trading Card Section in Stores Nationwide",
      date: "February 10, 2025",
      category: "Retailer Updates",
      excerpt: "Walmart has announced plans to expand its trading card sections in stores nationwide, with dedicated space for Pokemon TCG products. The expansion includes better security measures and an improved display system."
    }
  ];

  const marketAnalysis = [
    {
      title: "Paldean Fates Singles: Price Trends and Investment Opportunities",
      date: "February 26, 2025",
      category: "Market Analysis",
      excerpt: "An in-depth look at the secondary market for Paldean Fates singles, including which cards are holding value and which may be undervalued for collectors and investors."
    },
    {
      title: "The Rising Value of Alternate Art Cards: A Collector's Guide",
      date: "February 19, 2025",
      category: "Market Analysis",
      excerpt: "Alternate art cards have seen significant price growth over the past year. We analyze the trends and offer insights on collecting these popular chase cards."
    },
    {
      title: "Pokemon TCG Market Report: February 2025",
      date: "February 12, 2025",
      category: "Market Analysis",
      excerpt: "Our monthly market report examines sales data, price movements, and market sentiment across the Pokemon TCG ecosystem, with a focus on modern sets and sealed product."
    }
  ];

  const restockAlerts = [
    {
      title: "GameStop Restocking Charizard ex Premium Collections Today",
      date: "March 2, 2025",
      category: "Restocks",
      excerpt: "GameStop has confirmed they'll be restocking the popular Charizard ex Premium Collection today at 12pm EST online and in select stores. Learn how to maximize your chances of getting one."
    },
    {
      title: "Pokemon Center Scarlet & Violet Ultra Premium Collection Back in Stock",
      date: "February 28, 2025",
      category: "Restocks",
      excerpt: "The highly-sought Scarlet & Violet Ultra Premium Collection is back in stock at Pokemon Center with a limit of 1 per customer. These sold out quickly during previous restocks."
    },
    {
      title: "Best Buy Adding Ancient Legends ETBs to Inventory This Week",
      date: "February 22, 2025",
      category: "Restocks",
      excerpt: "Best Buy will be adding Ancient Legends Elite Trainer Boxes to their inventory this week, with online availability expected starting Thursday morning."
    }
  ];
  
  const recentReleases = [
    {
      name: "Prismatic Evolutions",
      releaseDate: "February 15, 2025",
      popularity: 100,
      imageUrl: "https://comicbook.com/wp-content/uploads/sites/4/2024/11/Pokemon-TCG-Prismatic-Evolutions.jpg?resize=1024"
    },
    {
      name: "Surging Sparks",
      releaseDate: "January 10, 2025",
      popularity: 100,
      imageUrl: "https://tcgplayer-cdn.tcgplayer.com/set_icon/SV08SurgingSparks.png"
    },
    {
      name: "Stellar Crown",
      releaseDate: "December 5, 2024",
      popularity: 82,
      imageUrl: "https://happytcg.ca/wp-content/uploads/2024/06/GRFQGGfXEAAJIrh.jpg"
    }
  ];
  
  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-3xl font-bold mb-6">TCG News & Updates</h1>
        <p className="text-gray-700 mb-8">
          Stay up-to-date with the latest TCG news, release dates, restock alerts, and market analysis. We cover product announcements, retailer restocks, tournament news, and more to keep you informed on everything happening in the world of Pokemon cards.
        </p>
        
        <FeaturedNews {...featuredArticle} />
        
        <h2 className="text-xl font-semibold mb-4">Recent Pokemon Set Releases</h2>
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="space-y-2">
            {recentReleases.map((release, index) => (
              <RecentRelease key={index} {...release} />
            ))}
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All News</TabsTrigger>
            <TabsTrigger value="product">Product News</TabsTrigger>
            <TabsTrigger value="restocks">Restock Alerts</TabsTrigger>
            <TabsTrigger value="market">Market Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentNews.slice(0, 3).map((article, index) => (
                <NewsPreview key={index} {...article} featured={index === 0} />
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {recentNews.slice(3).map((article, index) => (
                <NewsPreview key={index + 3} {...article} />
              ))}
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Latest Restock Alerts</h2>
                <div className="space-y-6">
                  {restockAlerts.slice(0, 2).map((article, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <h3 className="text-lg font-medium mb-1">{article.title}</h3>
                      <p className="text-gray-500 text-sm mb-2">{article.date}</p>
                      <p className="text-gray-700">{article.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Market Analysis</h2>
                <div className="space-y-6">
                  {marketAnalysis.slice(0, 2).map((article, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <h3 className="text-lg font-medium mb-1">{article.title}</h3>
                      <p className="text-gray-500 text-sm mb-2">{article.date}</p>
                      <p className="text-gray-700">{article.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="product">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentNews.filter(article => article.category === "Product News").map((article, index) => (
                <NewsPreview key={index} {...article} featured={index === 0} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="restocks">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restockAlerts.map((article, index) => (
                <NewsPreview key={index} {...article} featured={index === 0} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="market">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketAnalysis.map((article, index) => (
                <NewsPreview key={index} {...article} featured={index === 0} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-6 rounded-lg">
          <div>
            <h2 className="text-xl font-semibold mb-2">Never Miss a Restock or Announcement</h2>
            <p className="text-gray-700">Subscribe to our newsletter for breaking Pokemon TCG news delivered to your inbox.</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Tournament Results</h2>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium mb-1">Charlotte Regional Championships Results</h3>
              <p className="text-gray-500 text-sm mb-2">February 24, 2025</p>
              <p className="text-gray-700">
                The Charlotte Regional Championships concluded this weekend with Jason Mitchell securing first place using a Mew VMAX/Gengar deck in a field dominated by Paldean variants. The tournament saw over 800 Masters Division competitors with surprising representation from Zoroark ex/Slowking decks in the top 32.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium mb-1">Special Event: 25th Anniversary Invitational Top 8 Decklists</h3>
              <p className="text-gray-500 text-sm mb-2">February 17, 2025</p>
              <p className="text-gray-700">
                The Pokemon Company International's 25th Anniversary Invitational showcased innovative decks from the game's top players. We break down the top 8 decklists and the surprising tech choices that helped these players advance.
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Pokemon TCG Releases</h2>
            <ul className="space-y-4">
              <li className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Heat Wave Arena</h3>
                    <p className="text-sm text-gray-700">Main Set</p>
                  </div>
                  <span className="text-sm text-gray-600">March 14, 2025</span>
                </div>
              </li>
              <li className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Journey Together</h3>
                    <p className="text-sm text-gray-700">Main Set</p>
                  </div>
                  <span className="text-sm text-gray-600">March 28, 2025</span>
                </div>
              </li>
              <li>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Glory of Team Rocket</h3>
                    <p className="text-sm text-gray-700">Special Set</p>
                  </div>
                  <span className="text-sm text-gray-600">April 18, 2025</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewsPage;
