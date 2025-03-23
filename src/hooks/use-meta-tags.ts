
import { useEffect } from 'react';

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
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
  ogImage,
  canonicalUrl,
  structuredData,
  twitterCard,
  twitterTitle,
  twitterDescription,
  twitterImage
}: MetaTagsProps) => {
  useEffect(() => {
    // Set document title
    document.title = title ? `${title} | TCG Updates` : 'TCG Updates';
    
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

    // Create or update Twitter Card meta tags
    const updateTwitterMetaTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
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
    updateOgMetaTag('og:type', 'website');
    updateOgMetaTag('og:url', canonicalUrl || window.location.href.split('#')[0]);
    
    if (ogImage) {
      updateOgMetaTag('og:image', ogImage);
    }

    // Set Twitter Card tags
    if (twitterCard || twitterTitle || twitterDescription || twitterImage) {
      updateTwitterMetaTag('twitter:card', twitterCard || 'summary_large_image');
      updateTwitterMetaTag('twitter:title', twitterTitle || ogTitle || title);
      updateTwitterMetaTag('twitter:description', twitterDescription || ogDescription || description);
      
      if (twitterImage || ogImage) {
        updateTwitterMetaTag('twitter:image', twitterImage || ogImage);
      }
    }
    
    // Set canonical URL to help with SEO and AdSense
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    
    canonicalTag.setAttribute('href', canonicalUrl || window.location.href.split('#')[0]);

    // Add structured data if provided
    if (structuredData) {
      let structuredDataScript = document.querySelector('#structured-data-script');
      
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('id', 'structured-data-script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(structuredDataScript);
      }
      
      structuredDataScript.textContent = JSON.stringify(structuredData);
    } else {
      // Remove structured data script if not needed anymore
      const existingScript = document.querySelector('#structured-data-script');
      if (existingScript) {
        existingScript.remove();
      }
    }
    
    // Cleanup on unmount
    return () => {
      // No cleanup needed as we want meta tags to persist until replaced
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonicalUrl, structuredData, twitterCard, twitterTitle, twitterDescription, twitterImage]);
};
