
import React from 'react';

interface RecentReleaseProps {
  name: string;
  releaseDate: string;
  popularity: number;
  imageUrl?: string;
}

const RecentRelease = ({ 
  name = 'Unknown Set', 
  releaseDate = 'Unknown Date', 
  popularity = 0, 
  imageUrl = '' 
}: RecentReleaseProps) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Ensure popularity is a valid number between 0-100
  const safePopularity = isNaN(Number(popularity)) ? 0 : Math.min(Math.max(Number(popularity), 0), 100);
  
  return (
    <div className="flex border-b border-gray-200 py-4 last:border-0">
      <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
        {imageUrl && !imageError ? (
          <img 
            src={imageUrl} 
            alt={name || 'TCG Set'} 
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-xs text-gray-500">No Image</span>
        )}
      </div>
      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <h3 className="font-medium">{name || 'Unknown Set'}</h3>
          <span className="text-xs text-gray-600">Released: {releaseDate}</span>
        </div>
        <div className="flex items-center mt-2">
          <span className="text-xs text-gray-600 mr-2">Popularity:</span>
          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${safePopularity}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-600 ml-2">{safePopularity}%</span>
        </div>
      </div>
    </div>
  );
};

export default RecentRelease;
