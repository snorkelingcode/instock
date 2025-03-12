
// src/hooks/use-meta-tags.ts
import { useEffect } from 'react';

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/**
 * Hook to manage meta tags for SEO and AdSense compliance
 */
export const useMetaTags = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage
}: MetaTagsProps) => {
  useEffect(() => {
    // Set document title
    document.title = title;
    
    // Create or update meta tags
    const updateMetaTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };
    
    // Create or update Open Graph meta tags
    const updateOgMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };
    
    // Set meta description for SEO and AdSense
    updateMetaTag('description', description);
    
    // Set keywords if provided
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }
    
    // Set Open Graph tags for social sharing
    updateOgMetaTag('og:title', ogTitle || title);
    updateOgMetaTag('og:description', ogDescription || description);
    
    if (ogImage) {
      updateOgMetaTag('og:image', ogImage);
    }
    
    // Set canonical URL to help with SEO and AdSense
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    
    canonicalTag.setAttribute('href', window.location.href.split('#')[0]);
    
    // Cleanup on unmount
    return () => {
      // No cleanup needed as we want meta tags to persist until replaced
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage]);
};
