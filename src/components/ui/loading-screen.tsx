
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
        <img 
          src="/lovable-uploads/3ef7392a-c45d-4acd-bbdf-15d852b86297.png" 
          alt="TCG Updates" 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-auto z-10" 
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
