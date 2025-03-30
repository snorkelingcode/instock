
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Analytics } from "@vercel/analytics/react";

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const location = useLocation();
  
  // Update canonical URL based on current route
  useEffect(() => {
    // Get the canonical link element
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    
    // If it doesn't exist, create it
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    
    // Set the href to the current page's full URL
    const url = `https://tcgupdates.com${location.pathname}`;
    canonicalLink.setAttribute('href', url);
    
    // Also update Open Graph URL
    let ogUrlMeta = document.querySelector('meta[property="og:url"]');
    if (!ogUrlMeta) {
      ogUrlMeta = document.createElement('meta');
      ogUrlMeta.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrlMeta);
    }
    ogUrlMeta.setAttribute('content', url);
    
  }, [location.pathname]);

  return (
    <>
      <Layout>{children}</Layout>
      <Analytics />
    </>
  );
};
