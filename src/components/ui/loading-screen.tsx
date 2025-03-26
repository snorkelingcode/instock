
import React from 'react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  fullScreen = false 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-[#F5F5F7]' : 'p-8'}`}>
      <div className="relative w-64 h-64 mb-4">
        {/* TCG card logo (static) */}
        <img 
          src="/lovable-uploads/28915015-7dd0-40cc-b4aa-2a7315e689fb.png" 
          alt="TCG Updates" 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-auto z-10" 
        />
        {/* Spinning arrow animation */}
        <img 
          src="/lovable-uploads/d2ebd92a-d985-443a-aeef-7829896aad77.png" 
          alt="Loading" 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-auto animate-spin-slow" 
        />
      </div>
      <p className="mt-2 text-gray-700 font-medium">{message}</p>
    </div>
  );
};

export default LoadingScreen;
