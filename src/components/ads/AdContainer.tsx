
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
  
  useEffect(() => {
    // More strict content check - must have real paragraphs and headings
    const contentCheck = () => {
      const contentElements = document.querySelectorAll('p, h1, h2, h3, article, section');
      const paragraphs = document.querySelectorAll('p');
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      // More extensive check: need both paragraphs and headings, and enough total elements
      const hasContent = contentElements.length >= 3 && 
                          paragraphs.length >= 1 && 
                          headings.length >= 1;
      
      setHasEnoughContent(hasContent);
      return hasContent;
    };
    
    // Check content immediately
    if (!contentCheck()) {
      console.log('Not enough content to display ads safely');
      return;
    }
    
    // Use IntersectionObserver to detect when the ad container is visible
    const observer = new IntersectionObserver((entries) => {
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
    
    // Set up a periodic check for content (helpful for SPAs that load content dynamically)
    const contentCheckInterval = setInterval(() => {
      contentCheck();
    }, 1000);
    
    return () => {
      observer.disconnect();
      clearInterval(contentCheckInterval);
    };
  }, [adLoaded, hasEnoughContent]);
  
  // Initialize the ad when the container becomes visible
  useEffect(() => {
    if (isVisible && !adLoaded && hasEnoughContent) {
      try {
        // @ts-ignore - window.adsbygoogle is added by the AdSense script
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading AdSense ad:', error);
      }
    }
  }, [isVisible, adLoaded, hasEnoughContent]);
  
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
      
      {isVisible && hasEnoughContent && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-2985674561243221"
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidth ? "true" : "false"}
        ></ins>
      )}
    </div>
  );
};

export default AdContainer;
