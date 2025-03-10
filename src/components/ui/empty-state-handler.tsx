// src/components/ui/empty-state-handler.tsx
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
    // Set a reasonable delay to check for content
    const timer = setTimeout(() => {
      if (!isLoading) {
        const contentElements = document.querySelectorAll('p, h1, h2, h3, article, section');
        setHasMinimumContent(contentElements.length >= minimumContentLength);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isLoading, minimumContentLength]);
  
  if (isLoading) {
    return <>{loadingComponent}</>;
  }
  
  if (!hasItems || !hasMinimumContent) {
    return <>{emptyComponent}</>;
  }
  
  return <>{children}</>;
};

export default EmptyStateHandler;
