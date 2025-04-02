
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowRight, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createSlug } from "@/pages/ArticleDetails";

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
    else {
      const slug = createSlug(title);
      navigate(`/articles/${slug}`);
    }
  };
  
  const handleReadAloudClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    const slug = createSlug(title);
    navigate(`/articles/${slug}?autoplay=true`);
  };

  const youtubeId = video ? extractYoutubeId(video) : null;
  const youtubeThumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-red-200 overflow-hidden">
      <div className="md:flex">
        {(image || youtubeThumbnail) && (
          <div 
            className="md:w-2/5 h-48 md:h-auto relative overflow-hidden bg-red-50 cursor-pointer"
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
        <div className={`p-5 ${(image || youtubeThumbnail) ? 'md:w-3/5' : 'w-full'}`}>
          <div className="flex justify-between items-start mb-2">
            <Badge variant="default" className="font-medium">{category}</Badge>
            <Badge className="bg-red-500 hover:bg-red-600">Featured Story</Badge>
          </div>
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <div className="flex items-center text-gray-500 mb-3">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>{date}</span>
          </div>
          <div className="prose max-w-none text-gray-700 leading-relaxed mb-3 line-clamp-2">
            <p>{excerpt}</p>
          </div>
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" className="p-0 hover:bg-transparent text-red-600" onClick={handleReadClick}>
              Read Full Article <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600" 
              onClick={handleReadAloudClick}
              aria-label="Read article aloud"
            >
              <Volume2 className="h-4 w-4 mr-1" />
              <span className="text-xs">Read Aloud</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedNews;
