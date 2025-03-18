
import React, { useEffect } from 'react';
import { useBounds } from '@react-three/drei';

interface SmartModelContainerProps {
  children: React.ReactNode;
}

const SmartModelContainer: React.FC<SmartModelContainerProps> = ({ children }) => {
  const bounds = useBounds();
  
  useEffect(() => {
    // Automatically fit model to camera view after a short delay
    const timeoutId = setTimeout(() => {
      bounds.refresh().fit();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [bounds]);
  
  return (
    <group>
      {children}
    </group>
  );
};

export default SmartModelContainer;
