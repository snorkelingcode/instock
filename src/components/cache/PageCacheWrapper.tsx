
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cachePageContent, getCachedPageContent } from '@/utils/pageCache';

interface PageCacheWrapperProps {
  children: React.ReactNode;
}

/**
 * This component wraps page content to enable caching
 * It uses the route path as cache key and stores rendered components
 */
const PageCacheWrapper: React.FC<PageCacheWrapperProps> = ({ children }) => {
  const location = useLocation();
  const [key, setKey] = useState(Date.now());
  
  // Effect to handle page cache
  useEffect(() => {
    // The current path is used as the cache key
    const path = location.pathname;
    
    // Create an identifier for the component instance
    const cacheKey = `component_${path}`;
    
    // When a new path is loaded, update the key to force a re-render
    // This ensures that the actual component is properly instantiated
    setKey(Date.now());
    
    // Save the current scroll position when navigating away
    return () => {
      // Store the scroll position with the page
      const scrollData = {
        scrollY: window.scrollY,
        timestamp: Date.now()
      };
      cachePageContent(`${path}_scroll`, scrollData);
    };
  }, [location.pathname]);
  
  // Effect to restore scroll position
  useEffect(() => {
    const path = location.pathname;
    const scrollData = getCachedPageContent<{ scrollY: number, timestamp: number }>(`${path}_scroll`);
    
    if (scrollData) {
      // Use RAF to ensure the DOM has updated before scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollData.scrollY);
      });
    } else {
      // No cached scroll position, scroll to top
      window.scrollTo(0, 0);
    }
  }, [location.pathname, key]);
  
  return <React.Fragment key={key}>{children}</React.Fragment>;
};

export default PageCacheWrapper;
