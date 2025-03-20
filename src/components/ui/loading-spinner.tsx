
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'red' | 'blue' | 'green' | 'purple' | 'gray';
  showText?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'red',
  showText = false,
  text = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  const colorClasses = {
    red: 'border-t-red-500',
    blue: 'border-t-blue-500',
    green: 'border-t-green-500',
    purple: 'border-t-purple-500',
    gray: 'border-t-gray-500'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-gray-300",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
      />
      {showText && (
        <span className="mt-2 text-sm text-gray-600">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
