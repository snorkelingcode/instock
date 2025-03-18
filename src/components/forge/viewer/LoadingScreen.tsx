
import React from 'react';
import { useProgress } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  const { progress } = useProgress();
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white z-10">
      <Loader2 className="h-10 w-10 animate-spin mb-2" />
      <div className="text-sm font-medium">{Math.round(progress)}% loaded</div>
    </div>
  );
};

export default LoadingScreen;
