
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
      <img 
        src="/lovable-uploads/e60afbdf-2426-466b-ae0b-ebe03404efc4.png" 
        alt="TCG Updates" 
        className="w-32 h-auto mb-6" 
      />
      <div className="w-12 h-12 rounded-full border-4 border-red-600/20 border-t-red-600 animate-spin"></div>
      <p className="mt-4 text-gray-700 font-medium">{message}</p>
    </div>
  );
};

export default LoadingScreen;
