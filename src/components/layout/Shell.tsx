
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Analytics } from "@vercel/analytics/react";

interface ShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const Shell: React.FC<ShellProps> = ({ children, pageTitle }) => {
  const location = useLocation();
  
  // Update title, canonical URL, and other meta tags based on current route
  useEffect(() => {
    // Set page title with default fallback for SEO
    document.title = pageTitle 
      ? `${pageTitle} | TCG Updates - Trading Card Game News & Resources` 
      : 'TCG Updates - Trading Card Game News, Inventory & Market Tracker';
    
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
    
    // Update Open Graph title
    let ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (!ogTitleMeta) {
      ogTitleMeta = document.createElement('meta');
      ogTitleMeta.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitleMeta);
    }
    ogTitleMeta.setAttribute('content', document.title);
    
  }, [location.pathname, pageTitle]);

  return (
    <>
      <Layout>{children}</Layout>
      <Analytics />
    </>
  );
};
