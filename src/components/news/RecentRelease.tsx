
interface RecentReleaseProps {
  name: string;
  releaseDate: string;
  popularity: number;
}

const RecentRelease = ({ name, releaseDate, popularity }: RecentReleaseProps) => (
  <div className="flex border-b border-gray-200 py-4 last:border-0">
    <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
      <span className="text-xs text-gray-500">Image</span>
    </div>
    <div className="ml-4 flex-1">
      <div className="flex justify-between">
        <h3 className="font-medium">{name}</h3>
        <span className="text-xs text-gray-600">Released: {releaseDate}</span>
      </div>
      <div className="flex items-center mt-2">
        <span className="text-xs text-gray-600 mr-2">Popularity:</span>
        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full" 
            style={{ width: `${popularity}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-600 ml-2">{popularity}%</span>
      </div>
    </div>
  </div>
);

export default RecentRelease;
