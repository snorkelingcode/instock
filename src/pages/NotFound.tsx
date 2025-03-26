
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the attempted access to a non-existent route
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Add meta tags to help search engines understand this is a 404 page
    const noIndexMetaTag = document.createElement('meta');
    noIndexMetaTag.name = 'robots';
    noIndexMetaTag.content = 'noindex, nofollow';
    document.head.appendChild(noIndexMetaTag);
    
    // Set status code for crawlers
    const statusCodeMeta = document.createElement('meta');
    statusCodeMeta.name = 'prerender-status-code';
    statusCodeMeta.content = '404';
    document.head.appendChild(statusCodeMeta);
    
    return () => {
      // Clean up meta tags when component unmounts
      if (document.head.contains(noIndexMetaTag)) {
        document.head.removeChild(noIndexMetaTag);
      }
      if (document.head.contains(statusCodeMeta)) {
        document.head.removeChild(statusCodeMeta);
      }
    };
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-5xl font-bold mb-4 text-red-500">404</h1>
          <p className="text-xl text-gray-700 mb-6">Oops! Page not found</p>
          <p className="text-gray-600 mb-6">
            We couldn't find the page you were looking for. It might have been removed,
            renamed, or didn't exist in the first place.
          </p>
          <Button 
            onClick={handleGoHome}
            className="text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
