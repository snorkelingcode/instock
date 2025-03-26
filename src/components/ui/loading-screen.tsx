
import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  fullScreen = false 
}) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        // Slow down as we approach 100%
        const increment = Math.max(1, Math.floor((100 - prev) / 10));
        const newProgress = Math.min(99, prev + increment);
        return newProgress;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-[#F5F5F7]' : 'p-8'}`}>
      <div className="relative w-64 h-64 mb-4">
        <img 
          src="/lovable-uploads/3ef7392a-c45d-4acd-bbdf-15d852b86297.png" 
          alt="TCG Updates" 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-auto z-10" 
        />
      </div>
      <p className="mt-2 text-gray-700 font-medium">{message}</p>
      <div className="w-64 mt-4">
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
};

export default LoadingScreen;
