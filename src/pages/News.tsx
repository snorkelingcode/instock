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
import { supabase } from "@/integrations/supabase/client";
import { getCache, setCache } from "@/utils/cacheUtils";
import { Article } from "@/types/article";

const NewsPage = () => {
  useMetaTags({
    title: "TCG News & Updates | TCG In-Stock Tracker",
    description: "Stay up-to-date with the latest trading card game news, release dates, restock alerts, and market analysis for Pokemon, Magic, and more.",
    keywords: "TCG news, Pokemon TCG, Magic The Gathering, Yugioh, card game updates, restock alerts",
    ogTitle: "Latest TCG News & Updates | TCG In-Stock Tracker",
    ogDescription: "Get the latest news on Pokemon card restocks, new set releases, and market trends from all major retailers."
  });

  const [loading, setLoading] = React.useState(true);
  const [featuredArticle, setFeaturedArticle] = React.useState<Article | null>(null);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = React.useState<{
    all: Article[];
    product: Article[];
    restocks: Article[];
    market: Article[];
  }>({
    all: [],
    product: [],
    restocks: [],
    market: []
  });
  
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
  
  React.useEffect(() => {
    const fetchArticles = async () => {
      const cachedArticles = getCache<Article[]>('news_articles');
      const cachedFeaturedArticle = getCache<Article>('featured_article');
      
      if (cachedArticles && cachedFeaturedArticle) {
        setArticles(cachedArticles);
        setFeaturedArticle(cachedFeaturedArticle);
        processArticles(cachedArticles);
        setLoading(false);
      }
      
      try {
        // Fetch featured article
        const { data: featuredData, error: featuredError } = await supabase
          .rpc('get_featured_article');
          
        if (featuredError) {
          console.error("Error fetching featured article:", featuredError);
        }

        // Fetch all published articles
        const { data: allData, error: allError } = await supabase
          .rpc('get_published_articles');

        if (allError) {
          throw allError;
        }
        
        if (allData) {
          setArticles(allData);
          setCache('news_articles', allData, 5);
          processArticles(allData);
        }
        
        if (featuredData) {
          setFeaturedArticle(featuredData);
          setCache('featured_article', featuredData, 5);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching articles:', error);
        
        if (!cachedArticles) {
          setLoading(false);
        }
      }
    };
    
    fetchArticles();
  }, []);
  
  const processArticles = (articles: Article[]) => {
    const filtered = {
      all: articles,
      product: articles.filter(article => article.category === "Product News"),
      restocks: articles.filter(article => article.category === "Restocks" || article.category === "New Release"),
      market: articles.filter(article => article.category === "Market Analysis")
    };
    
    setFilteredArticles(filtered);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <EmptyStateHandler
        isLoading={loading}
        hasItems={true}
        loadingComponent={<div className="p-8 text-center">Loading news content...</div>}
        emptyComponent={<div className="p-8 text-center">No news available at this time.</div>}
      >
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-3xl font-bold mb-6">TCG News & Updates</h1>
          <p className="text-gray-700 mb-8">
            Stay up-to-date with the latest TCG news, release dates, restock alerts, and market analysis. We cover product announcements, retailer restocks, tournament news, and more to keep you informed on everything happening in the world of Pokemon cards.
          </p>
          
          {featuredArticle ? (
            <FeaturedNews 
              title={featuredArticle.title}
              date={formatDate(featuredArticle.published_at || featuredArticle.created_at)}
              category={featuredArticle.category}
              content={featuredArticle.content}
            />
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <p className="text-gray-500 text-center">Featured article coming soon!</p>
            </div>
          )}
          
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
              {filteredArticles.all.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredArticles.all.slice(0, 3).map((article, index) => (
                      <NewsPreview 
                        key={article.id}
                        title={article.title}
                        date={formatDate(article.published_at || article.created_at)}
                        category={article.category}
                        excerpt={article.excerpt}
                        featured={index === 0}
                      />
                    ))}
                  </div>
                  
                  <AdContainer 
                    className="my-8" 
                    adSlot="auto" 
                    adFormat="rectangle" 
                    fullWidth={true} 
                  />
                  
                  {filteredArticles.all.length > 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      {filteredArticles.all.slice(3).map((article, index) => (
                        <NewsPreview 
                          key={article.id}
                          title={article.title}
                          date={formatDate(article.published_at || article.created_at)}
                          category={article.category}
                          excerpt={article.excerpt}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center">
                  <p>No news articles available yet. Check back soon for updates!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="product">
              {filteredArticles.product.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredArticles.product.map((article, index) => (
                    <NewsPreview 
                      key={article.id}
                      title={article.title}
                      date={formatDate(article.published_at || article.created_at)}
                      category={article.category}
                      excerpt={article.excerpt}
                      featured={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p>No product news available yet. Check back soon for updates!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="restocks">
              {filteredArticles.restocks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredArticles.restocks.map((article, index) => (
                    <NewsPreview 
                      key={article.id}
                      title={article.title}
                      date={formatDate(article.published_at || article.created_at)}
                      category={article.category}
                      excerpt={article.excerpt}
                      featured={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p>No restock alerts available yet. Check back soon for updates!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="market">
              {filteredArticles.market.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredArticles.market.map((article, index) => (
                    <NewsPreview 
                      key={article.id}
                      title={article.title}
                      date={formatDate(article.published_at || article.created_at)}
                      category={article.category}
                      excerpt={article.excerpt}
                      featured={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p>No market analysis available yet. Check back soon for updates!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-6 rounded-lg">
            <div>
              <h2 className="text-xl font-semibold mb-2">Never Miss a Restock or Announcement</h2>
            </div>
          </div>
        </div>
      </EmptyStateHandler>
    </Layout>
  );
};

export default NewsPage;
