
interface RecentReleaseProps {
  name: string;
  releaseDate: string;
  popularity: number;
  imageUrl?: string;
}

const RecentRelease = ({ name, releaseDate, popularity, imageUrl }: RecentReleaseProps) => {
  // Ensure popularity is within 0-100 range
  const safePopularity = Math.min(100, Math.max(0, popularity || 0));
  
  return (
    <div className="flex flex-col sm:flex-row border-b border-gray-200 py-4 last:border-0">
      <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden mb-3 sm:mb-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/475569?text=TCG";
            }}
          />
        ) : (
          <span className="text-xs text-gray-500">Image</span>
        )}
      </div>
      <div className="sm:ml-4 flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <h3 className="font-medium">{name}</h3>
          <span className="text-xs text-gray-600 mt-1 sm:mt-0">Released: {releaseDate}</span>
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
