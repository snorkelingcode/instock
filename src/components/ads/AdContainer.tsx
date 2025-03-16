
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AdContainerProps {
  adSlot?: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  fullWidth?: boolean;
  className?: string;
  showLabel?: boolean;
}

/**
 * A safe container for Google AdSense ads that:
 * - Only renders when there is content on the page
 * - Uses IntersectionObserver to load ads only when visible
 * - Adds proper labeling for compliance
 */
const AdContainer: React.FC<AdContainerProps> = ({
  adSlot = "auto",
  adFormat = "auto",
  fullWidth = true,
  className,
  showLabel = true
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasEnoughContent, setHasEnoughContent] = useState(false);
  const [adError, setAdError] = useState(false);
  
  useEffect(() => {
    // More strict content check - must have real paragraphs and headings
    const contentCheck = () => {
      try {
        const contentElements = document.querySelectorAll('p, h1, h2, h3, article, section');
        const paragraphs = document.querySelectorAll('p');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        // More extensive check: need both paragraphs and headings, and enough total elements
        const hasContent = contentElements.length >= 3 && 
                            paragraphs.length >= 1 && 
                            headings.length >= 1;
        
        setHasEnoughContent(hasContent);
        return hasContent;
      } catch (error) {
        console.error('Error checking content:', error);
        return false;
      }
    };
    
    // Check content immediately
    if (!contentCheck()) {
      console.log('Not enough content to display ads safely');
      return;
    }
    
    // Use IntersectionObserver to detect when the ad container is visible
    let observer: IntersectionObserver;
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !adLoaded && hasEnoughContent) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });
      
      if (adRef.current) {
        observer.observe(adRef.current);
      }
    } catch (error) {
      console.error('Error with IntersectionObserver:', error);
      // Fallback - set visible directly
      setIsVisible(true);
    }
    
    // Set up a periodic check for content (helpful for SPAs that load content dynamically)
    const contentCheckInterval = setInterval(() => {
      contentCheck();
    }, 1000);
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
      clearInterval(contentCheckInterval);
    };
  }, [adLoaded, hasEnoughContent]);
  
  // Initialize the ad when the container becomes visible
  useEffect(() => {
    if (isVisible && !adLoaded && hasEnoughContent && !adError) {
      try {
        // Check if adsbygoogle is available
        if (window.adsbygoogle === undefined) {
          window.adsbygoogle = [];
        }
        
        // Push the ad
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading AdSense ad:', error);
        setAdError(true);
      }
    }
  }, [isVisible, adLoaded, hasEnoughContent, adError]);
  
  // If there's not enough content, don't render the ad space at all
  if (!hasEnoughContent) {
    return null;
  }
  
  return (
    <div 
      ref={adRef}
      className={cn(
        "min-h-[100px] overflow-hidden",
        fullWidth ? "w-full" : "inline-block",
        className
      )}
    >
      {showLabel && (
        <div className="text-xs text-gray-500 mb-1">Advertisement</div>
      )}
      
      {isVisible && hasEnoughContent && !adError && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-2985674561243221"
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidth ? "true" : "false"}
        ></ins>
      )}
      
      {adError && (
        <div className="h-[200px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          Ad could not be loaded
        </div>
      )}
    </div>
  );
};

// Add this to the window object to avoid TypeScript errors
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default AdContainer;
