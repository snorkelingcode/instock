
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'red' | 'blue' | 'green' | 'purple' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'red'
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
    <div className="flex justify-center items-center">
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-gray-300",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
      />
    </div>
  );
};

export default LoadingSpinner;
