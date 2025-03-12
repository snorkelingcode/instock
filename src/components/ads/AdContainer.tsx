
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
  
  useEffect(() => {
    // Check if the page has enough content before showing ads
    const contentElements = document.querySelectorAll('p, h1, h2, h3, article, section');
    const hasEnoughContent = contentElements.length >= 3;
    
    if (!hasEnoughContent) {
      console.log('Not enough content to display ads safely');
      return;
    }
    
    // Use IntersectionObserver to detect when the ad container is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !adLoaded) {
          setIsVisible(true);
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    
    if (adRef.current) {
      observer.observe(adRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [adLoaded]);
  
  // Initialize the ad when the container becomes visible
  useEffect(() => {
    if (isVisible && !adLoaded) {
      try {
        // @ts-ignore - window.adsbygoogle is added by the AdSense script
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading AdSense ad:', error);
      }
    }
  }, [isVisible, adLoaded]);
  
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
      
      {isVisible && (
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
