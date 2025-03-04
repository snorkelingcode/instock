import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Navigation component from other pages
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col">
      <div className="flex justify-between items-center w-full">
        <Link to="/" className="text-xl font-bold">TCG In-Stock Tracker</Link>
        
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
          <Link to="/news" className="text-gray-700 hover:text-blue-600 font-medium">News</Link>
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
          <Link to="/products" className="text-gray-700 hover:text-blue-600 py-2">Products</Link>
          <Link to="/news" className="text-gray-700 hover:text-blue-600 font-medium py-2">News</Link>
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
        <h3 className="font-semibold mb-4">Trading Card In-Stock Tracker</h3>
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

// Single news article preview
const NewsPreview = ({ title, date, category, excerpt, featured = false }) => (
  <Card className={`transition-all ${featured ? 'border-blue-300 shadow-md' : ''}`}>
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
  </Card>
);

// Featured news article
const FeaturedNews = ({ title, date, category, content }) => (
  <div className="bg-white rounded-lg shadow-md border border-blue-200 mb-8">
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="default">{category}</Badge>
        <Badge className="bg-blue-500">Featured Story</Badge>
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{date}</p>
      <div className="prose max-w-none">
        <p className="text-gray-700">{content}</p>
      </div>
    </div>
  </div>
);

// Recent release component moved from Products page
const RecentRelease = ({ name, releaseDate, description, popularity }) => (
  <div className="flex border-b border-gray-200 py-4 last:border-0">
    <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
      <span className="text-xs text-gray-500">Image</span>
    </div>
    <div className="ml-4 flex-1">
      <div className="flex justify-between">
        <h3 className="font-medium">{name}</h3>
        <span className="text-xs text-gray-600">Released: {releaseDate}</span>
      </div>
      <p className="text-sm text-gray-700 mt-1">{description}</p>
      <div className="flex items-center mt-2">
        <span className="text-xs text-gray-600 mr-2">Popularity:</span>
        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full" 
            style={{ width: `${popularity}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-600 ml-2">{popularity}%</span>
      </div>
    </div>
  </div>
);

const NewsPage = () => {
  // Sample news data
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
  
  // Recent set releases data (moved from Products page)
  const recentReleases = [
    {
      name: "Twilight Masquerade",
      releaseDate: "February 15, 2025",
      description: "Introducing new Legendary Pokemon and ex mechanics with a focus on Psychic and Ghost types.",
      popularity: 85
    },
    {
      name: "Paldean Fates",
      releaseDate: "January 10, 2025",
      description: "Special shiny collection featuring Paradox Pokemon and Terastal phenomenon.",
      popularity: 92
    },
    {
      name: "Temporal Forces",
      releaseDate: "December 5, 2024",
      description: "Expanded support for competitive archetypes with new Trainer cards and strategies.",
      popularity: 78
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-3xl font-bold mb-6">TCG News & Updates</h1>
          <p className="text-gray-700 mb-8">
            Stay up-to-date with the latest TCG news, release dates, restock alerts, and market analysis. We cover product announcements, retailer restocks, tournament news, and more to keep you informed on everything happening in the world of Pokemon cards.
          </p>
          
          <FeaturedNews {...featuredArticle} />
          
          {/* Recent Set Releases section moved from Products page */}
          <h2 className="text-xl font-semibold mb-4">Recent Set Releases</h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="space-y-2">
              {recentReleases.map((release, index) => (
                <RecentRelease key={index} {...release} />
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline">View All Sets</Button>
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
              <h2 className="text-xl font-semibold mb-4">Upcoming Releases</h2>
              <ul className="space-y-4">
                <li className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Twilight Masquerade</h3>
                      <p className="text-sm text-gray-700">Main Set</p>
                    </div>
                    <span className="text-sm text-gray-600">May 10, 2025</span>
                  </div>
                </li>
                <li className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Gardevoir ex Collection</h3>
                      <p className="text-sm text-gray-700">Special Collection</p>
                    </div>
                    <span className="text-sm text-gray-600">April 19, 2025</span>
                  </div>
                </li>
                <li className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Pokemon 151</h3>
                      <p className="text-sm text-gray-700">Special Set</p>
                    </div>
                    <span className="text-sm text-gray-600">June 7, 2025</span>
                  </div>
                </li>
                <li className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Champion's Path 2</h3>
                      <p className="text-sm text-gray-700">Premium Collection</p>
                    </div>
                    <span className="text-sm text-gray-600">July 12, 2025</span>
                  </div>
                </li>
                <li>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Temporal Forces</h3>
                      <p className="text-sm text-gray-700">Main Set</p>
                    </div>
                    <span className="text-sm text-gray-600">August 23, 2025</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default NewsPage;
