
import React, { useState, useEffect } from 'react';

interface EmptyStateHandlerProps {
  children: React.ReactNode;
  isLoading: boolean;
  hasItems: boolean;
  loadingComponent: React.ReactNode;
  emptyComponent: React.ReactNode;
  minimumContentLength?: number;
}

/**
 * Component that handles empty and loading states properly
 * to ensure ads are never shown alongside empty content
 */
const EmptyStateHandler: React.FC<EmptyStateHandlerProps> = ({
  children,
  isLoading,
  hasItems,
  loadingComponent,
  emptyComponent,
  minimumContentLength = 3
}) => {
  const [hasMinimumContent, setHasMinimumContent] = useState(false);
  
  useEffect(() => {
    // Check immediately if content is ready to display
    if (!isLoading && hasItems) {
      // Verify the DOM has adequate content for AdSense requirements
      const contentElements = document.querySelectorAll('p, h1, h2, h3, article, section');
      setHasMinimumContent(contentElements.length >= minimumContentLength);
    }
    
    // If we're still loading or don't have items, set a meta tag to prevent ad crawling
    if (isLoading || !hasItems) {
      const noAdsMetaTag = document.createElement('meta');
      noAdsMetaTag.name = 'robots';
      noAdsMetaTag.content = 'noindex, nofollow, noodp, noydir';
      document.head.appendChild(noAdsMetaTag);
      
      return () => {
        // Clean up meta tag when we have content
        if (document.head.contains(noAdsMetaTag)) {
          document.head.removeChild(noAdsMetaTag);
        }
      };
    }
  }, [isLoading, hasItems, minimumContentLength]);
  
  if (isLoading) {
    return <>{loadingComponent}</>;
  }
  
  if (!hasItems || !hasMinimumContent) {
    return <>{emptyComponent}</>;
  }
  
  return <>{children}</>;
};

export default EmptyStateHandler;
