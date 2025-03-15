import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import NewsPreview from "@/components/news/NewsPreview";
import FeaturedNews from "@/components/news/FeaturedNews";
import RecentRelease from "@/components/news/RecentRelease";
import AdContainer from "@/components/ads/AdContainer";
import { useMetaTags } from "@/hooks/use-meta-tags";
import EmptyStateHandler from "@/components/ui/empty-state-handler";

const NewsPage = () => {
  useMetaTags({
    title: "TCG News & Updates | TCG In-Stock Tracker",
    description: "Stay up-to-date with the latest trading card game news, release dates, restock alerts, and market analysis for Pokemon, Magic, and more.",
    keywords: "TCG news, Pokemon TCG, Magic The Gathering, Yugioh, card game updates, restock alerts",
    ogTitle: "Latest TCG News & Updates | TCG In-Stock Tracker",
    ogDescription: "Get the latest news on Pokemon card restocks, new set releases, and market trends from all major retailers."
  });

  const [contentLoaded, setContentLoaded] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setContentLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const featuredArticle = {
    title: "GameStop Discontinues TCG Pre-Orders, Adds Purchase Limits and Grading Services",
    date: "March 14, 2025",
    category: "Retailer Updates",
    content: "GameStop has announced significant changes to its Pokemon TCG sales policies, discontinuing pre-orders for all Pokemon TCG products effective immediately. The retailer will also be implementing purchase limits on select SKUs to combat scalping. In a statement, GameStop explained, \"Our goal is to ensure more fans have the opportunity to experience these exciting releases, rather than limiting access to early buyers and resellers.\" \n\nIn addition to these policy changes, GameStop is introducing free card savers and sleeves for PSA grading, specifically available during launch weekends at their new \"Rip and Submit\" events. These events create a unique experience where fans can open cards and send them to be graded immediately on-site. This service aims to streamline the grading process for collectors and create a more engaging in-store experience for the TCG community. The first Rip and Submit event is scheduled to coincide with the release of the Twilight Masquerade expansion in May."
  };
  
  const recentNews = [
    {
      title: "GameStop Discontinues TCG Pre-Orders, Adds Purchase Limits and Grading Services",
      date: "March 14, 2025",
      category: "Retailer Updates",
      excerpt: "GameStop has announced significant changes to its Pokemon TCG sales policies, discontinuing pre-orders for all Pokemon TCG products effective immediately. The retailer will also be implementing purchase limits on select SKUs to combat scalping. In a statement, GameStop explained, \"Our goal is to ensure more fans have the opportunity to experience these exciting releases, rather than limiting access to early buyers and resellers.\" \n\nIn addition to these policy changes, GameStop is introducing free card savers and sleeves for PSA grading, specifically available during launch weekends at their new \"Rip and Submit\" events. These events create a unique experience where fans can open cards and send them to be graded immediately on-site. This service aims to streamline the grading process for collectors and create a more engaging in-store experience for the TCG community. The first Rip and Submit event is scheduled to coincide with the release of the Twilight Masquerade expansion in May."
    },
    {
      title: "Paldean Fates Restock Coming to Pokemon Center Next Week",
      date: "March 14, 2025",
      category: "New Release",
      excerpt: "Pokemon Azure Legends Tin featuring Kyogre, Dialga, and Xerneas make an appearance for the first time in your local Target! These tins, as of right now, come with two packs of Surging Sparks, one pack of Stellar Crown, one pack of Temporal Forces, and one pack of Obsidian Flames. You also get a Kyogre ex, Dialga ex, or Xerneas ex black star promo card. As well as a code card for TCG Online. Check the card section for the chance to score one of these tins. We will also update the site if any are found online and in stock."
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
      title: "Target Now Stocking Pokemon Azure Legends Tins",
      date: "March 14, 2025",
      category: "Restocks",
      excerpt: "Pokemon Azure Legends Tin featuring Kyogre, Dialga, and Xerneas make an appearance for the first time in your local Target! These tins, as of right now, come with two packs of Surging Sparks, one pack of Stellar Crown, one pack of Temporal Forces, and one pack of Obsidian Flames. You also get a Kyogre ex, Dialga ex, or Xerneas ex black star promo card. As well as a code card for TCG Online. Check the card section for the chance to score one of these tins. We will also update the site if any are found online and in stock."
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
      <EmptyStateHandler
        isLoading={!contentLoaded}
        hasItems={true}
        loadingComponent={<div className="p-8 text-center">Loading news content...</div>}
        emptyComponent={<div className="p-8 text-center">No news available at this time.</div>}
      >
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-3xl font-bold mb-6">TCG News & Updates</h1>
          <p className="text-gray-700 mb-8">
            Stay up-to-date with the latest TCG news, release dates, restock alerts, and market analysis. We cover product announcements, retailer restocks, tournament news, and more to keep you informed on everything happening in the world of Pokemon cards.
          </p>
          
          <FeaturedNews {...featuredArticle} />
          
          <AdContainer 
            className="my-8" 
            adSlot="auto" 
            adFormat="horizontal" 
            fullWidth={true} 
          />
          
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
              
              <AdContainer 
                className="my-8" 
                adSlot="auto" 
                adFormat="rectangle" 
                fullWidth={true} 
              />
              
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
            
            <AdContainer 
              className="mt-8" 
              adSlot="auto" 
              adFormat="horizontal" 
              fullWidth={true} 
            />
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
      </EmptyStateHandler>
    </Layout>
  );
};

export default NewsPage;
