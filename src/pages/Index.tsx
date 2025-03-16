
import React, { useEffect } from "react";
import { CardGrid } from "@/components/landing/CardGrid";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import AdContainer from "@/components/ads/AdContainer";
import { useMetaTags } from "@/hooks/use-meta-tags";
import EmptyStateHandler from "@/components/ui/empty-state-handler";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import FeaturedProducts from "@/components/products/FeaturedProducts";
import { getCache, setCache } from "@/utils/cacheUtils";
import NewsPreview from "@/components/news/NewsPreview";

const SiteIntro = () => (
  <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-4">Welcome to TCG In-Stock Tracker</h2>
    <p className="text-gray-700 mb-4">
      Finding your favorite trading card products shouldn't be a challenge in 2025. Our mission is to help collectors and players
      locate in-stock trading cards, boxes, and accessories from all major retailers in one convenient place.
    </p>
    <p className="text-gray-700 mb-4">
      We track inventory from Pokemon Center, Target, Walmart, GameStop, and other retailers in real-time,
      so you never miss a restock or new release. We check for product availability multiple times per day
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

const HowItWorksSection = () => (
  <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-6">How TCG In-Stock Tracker Works</h2>
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

const LatestNews = ({ articles }: { articles: any[] }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-semibold mb-6">Latest TCG News</h2>
    {articles.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article, index) => (
          <NewsPreview
            key={article.id}
            title={article.title}
            date={new Date(article.published_at || article.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            category={article.category}
            excerpt={article.excerpt}
            featured={index === 0}
          />
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-500">Stay tuned for upcoming news and announcements.</p>
      </div>
    )}
    <div className="text-center mt-6">
      <Button asChild variant="outline">
        <Link to="/news">View All News</Link>
      </Button>
    </div>
  </section>
);

const NoProductsFound = () => (
  <div className="text-center py-8">
    <p className="text-gray-500">No products found. Please check back later for updates.</p>
  </div>
);

const Index = () => {
  useMetaTags({
    title: "TCG In-Stock Tracker | Find Trading Card Game Products",
    description: "Find TCG products in stock at major retailers. Track inventory for Pokemon Center, Target, Walmart, GameStop and more in real-time with accurate updates.",
    keywords: "Pokemon, TCG, trading cards, in stock, tracker, booster box, elite trainer box, target, walmart",
    ogTitle: "TCG In-Stock Tracker - Find Your Favorite Cards In Stock",
    ogDescription: "Never miss a restock again. Get real-time inventory updates for Pokemon, Magic, Yu-Gi-Oh, and more from all major retailers."
  });

  const [loading, setLoading] = React.useState(true);
  const [hasProducts, setHasProducts] = React.useState(false);
  const [featuredProducts, setFeaturedProducts] = React.useState<any[]>([]);
  const [featuredLoading, setFeaturedLoading] = React.useState(true);
  const [latestArticles, setLatestArticles] = React.useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = React.useState(true);

  // Fetch products
  React.useEffect(() => {
    const loadProducts = async () => {
      const cachedProducts = getCache<any[]>('featured_products');
      const cachedHasProducts = getCache<boolean>('has_products');
      
      if (cachedProducts) {
        setFeaturedProducts(cachedProducts);
        setFeaturedLoading(false);
        setHasProducts(!!cachedHasProducts);
        setLoading(false);
      }
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false })
          .limit(3);

        if (error) {
          throw error;
        }

        if (data) {
          setFeaturedProducts(data);
          setFeaturedLoading(false);
          setHasProducts(data.length > 0);
          setLoading(false);
          
          setCache('featured_products', data, 5);
          setCache('has_products', data.length > 0, 5);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        
        if (!cachedProducts) {
          setFeaturedLoading(false);
          setLoading(false);
        }
      }
    };

    loadProducts();
  }, []);

  // Fetch latest articles
  React.useEffect(() => {
    const loadArticles = async () => {
      const cachedArticles = getCache<any[]>('latest_articles');
      
      if (cachedArticles) {
        setLatestArticles(cachedArticles);
        setArticlesLoading(false);
      }
      
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(3);

        if (error) {
          throw error;
        }

        if (data) {
          setLatestArticles(data);
          setArticlesLoading(false);
          setCache('latest_articles', data, 5);
        }
      } catch (error) {
        console.error('Error fetching latest articles:', error);
        
        if (!cachedArticles) {
          setArticlesLoading(false);
        }
      }
    };

    loadArticles();
  }, []);

  return (
    <Layout>
      <SiteIntro />
      
      {!loading && hasProducts && (
        <AdContainer 
          className="my-8" 
          adSlot="auto" 
          adFormat="horizontal" 
          fullWidth={true} 
        />
      )}
      
      <HowItWorksSection />
      
      <EmptyStateHandler
        isLoading={articlesLoading}
        hasItems={latestArticles.length > 0}
        loadingComponent={<LoadingSpinner size="lg" />}
        emptyComponent={<div className="text-center py-8">No news articles available yet.</div>}
      >
        <LatestNews articles={latestArticles} />
      </EmptyStateHandler>
      
      <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
      <FeaturedProducts products={featuredProducts} loading={featuredLoading} />
      
      <h2 className="text-2xl font-semibold mb-6">Latest In-Stock Products</h2>
      
      <EmptyStateHandler
        isLoading={loading}
        hasItems={hasProducts}
        loadingComponent={<LoadingSpinner size="lg" />}
        emptyComponent={<NoProductsFound />}
      >
        <CardGrid />
        
        {hasProducts && (
          <div className="mt-8">
            <AdContainer 
              className="my-4" 
              adSlot="auto" 
              adFormat="rectangle" 
              fullWidth={true} 
            />
          </div>
        )}
      </EmptyStateHandler>
    </Layout>
  );
};

export default Index;
