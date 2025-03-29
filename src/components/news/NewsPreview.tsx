
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NewsPreviewProps {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  featured?: boolean;
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

const NewsPreview = ({ 
  id, 
  title, 
  date, 
  category, 
  excerpt, 
  featured = false, 
  image,
  video,
  mediaType = 'image',
  onClick 
}: NewsPreviewProps) => {
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
  const youtubeThumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

  return (
    <Card 
      className={`transition-all h-full flex flex-col ${featured ? 'border-red-300 shadow-md' : ''} cursor-pointer hover:shadow-lg`}
      onClick={handleReadClick}
      role="button"
      aria-label={`View article: ${title}`}
    >
      {(image || youtubeThumbnail) && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg relative">
          {mediaType === 'video' && youtubeId ? (
            <div className="relative w-full h-full">
              <img 
                src={youtubeThumbnail} 
                alt={title} 
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-600 bg-opacity-80 rounded-full w-10 h-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          )}
        </div>
      )}
      <CardHeader className="pb-1 pt-2">
        <div className="flex justify-between items-start mb-1">
          <Badge variant={category === 'Product News' ? 'default' : category === 'Release Dates' ? 'secondary' : 'outline'}>
            {category}
          </Badge>
          {featured && <Badge className="bg-red-500">Featured</Badge>}
        </div>
        <CardTitle className="text-md">{title}</CardTitle>
        <CardDescription className="text-gray-500 text-xs">{date}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow py-1">
        <p className="text-gray-700 text-sm line-clamp-2">{excerpt}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-1 pb-2">
        <Button 
          variant="ghost" 
          className="p-0 hover:bg-transparent text-red-600 text-xs" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the card click
            handleReadClick();
          }}
        >
          Read More <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-600 h-6" 
          onClick={handleReadAloudClick}
          aria-label="Read article aloud"
        >
          <Volume2 className="h-3 w-3 mr-1" />
          <span className="text-xs">Read</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewsPreview;
