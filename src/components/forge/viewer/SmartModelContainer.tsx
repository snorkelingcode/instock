
import React, { useEffect } from 'react';
import { useBounds } from '@react-three/drei';

interface SmartModelContainerProps {
  children: React.ReactNode;
}

const SmartModelContainer: React.FC<SmartModelContainerProps> = ({ children }) => {
  const bounds = useBounds();
  
  useEffect(() => {
    // Automatically fit model to camera view after a longer delay
    // Increasing the delay to ensure model is fully loaded and mounted
    const timeoutId = setTimeout(() => {
      bounds.refresh().fit();
    }, 1000); // Increased from 500ms to 1000ms
    
    return () => clearTimeout(timeoutId);
  }, [bounds]);
  
  return (
    <group>
      {children}
    </group>
  );
};

export default SmartModelContainer;
