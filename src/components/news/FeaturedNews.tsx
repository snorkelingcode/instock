
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowRight, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeaturedNewsProps {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  image?: string;
  video?: string;
  mediaType?: 'image' | 'video';
  onClick?: () => void;
}

// Function to extract YouTube video ID
const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

const FeaturedNews = ({ 
  id, 
  title, 
  date, 
  category, 
  excerpt, 
  image, 
  video,
  mediaType = 'image',
  onClick 
}: FeaturedNewsProps) => {
  const navigate = useNavigate();
  
  const handleReadClick = () => {
    if (onClick) onClick();
    else navigate(`/article/${id}`);
  };
  
  const handleReadAloudClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    navigate(`/article/${id}?autoplay=true`);
  };

  // Generate YouTube thumbnail if needed
  const youtubeId = video ? extractYoutubeId(video) : null;
  const youtubeThumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-red-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col md:flex-row h-full">
        {/* Image/Video Section - Takes up left side on desktop */}
        {(image || youtubeThumbnail) && (
          <div 
            className="md:w-2/5 h-40 md:h-auto relative overflow-hidden bg-red-50 cursor-pointer"
            onClick={handleReadClick}
            role="button"
            aria-label={`View featured article: ${title}`}
          >
            {mediaType === 'video' && youtubeId ? (
              <div className="relative w-full h-full">
                <img 
                  src={youtubeThumbnail} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={image} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Content Section - Takes up right side on desktop */}
        <div className="p-3 md:w-3/5">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="default" className="font-medium">{category}</Badge>
            <Badge className="bg-red-500 hover:bg-red-600">Featured Story</Badge>
          </div>
          <h2 className="text-lg font-bold mb-1">{title}</h2>
          <div className="flex items-center text-gray-500 mb-2">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className="text-sm">{date}</span>
          </div>
          <div className="prose max-w-none text-gray-700 text-sm leading-relaxed mb-2">
            <p>{excerpt}</p>
          </div>
          <div className="flex items-center justify-between mt-1">
            <Button variant="ghost" className="p-0 hover:bg-transparent text-red-600 text-sm" onClick={handleReadClick}>
              Read Full Article <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 h-7" 
              onClick={handleReadAloudClick}
              aria-label="Read article aloud"
            >
              <Volume2 className="h-3 w-3 mr-1" />
              <span className="text-xs">Read</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedNews;
