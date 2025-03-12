
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the attempted access to a non-existent route
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Add a meta tag to prevent ad serving on this page
    const noAdsMetaTag = document.createElement('meta');
    noAdsMetaTag.name = 'robots';
    noAdsMetaTag.content = 'noindex, nofollow, noodp, noydir';
    document.head.appendChild(noAdsMetaTag);
    
    // Also add a meta tag specifically for AdSense
    const noAdsenseMetaTag = document.createElement('meta');
    noAdsenseMetaTag.name = 'googlebot';
    noAdsenseMetaTag.content = 'noindex';
    document.head.appendChild(noAdsenseMetaTag);
    
    return () => {
      // Clean up meta tags when component unmounts
      document.head.removeChild(noAdsMetaTag);
      if (document.head.contains(noAdsenseMetaTag)) {
        document.head.removeChild(noAdsenseMetaTag);
      }
    };
  }, [location.pathname]);

  return (
    <Layout>
      {/* Use Layout component but with a special class for 404 pages */}
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-5xl font-bold mb-4 text-red-500">404</h1>
          <p className="text-xl text-gray-700 mb-6">Oops! Page not found</p>
          <p className="text-gray-600 mb-6">
            We couldn't find the page you were looking for. It might have been removed,
            renamed, or didn't exist in the first place.
          </p>
          <a 
            href="/" 
            className="text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md transition-colors inline-block"
          >
            Return to Home
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
