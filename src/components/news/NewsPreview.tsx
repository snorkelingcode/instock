
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createSlug } from "@/pages/ArticleDetails";

interface NewsPreviewProps {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  featured?: boolean;
  image?: string;
  video?: string;
  mediaType?: string;
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
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-1">
          <Badge variant={category === 'Product News' ? 'default' : category === 'Release Dates' ? 'secondary' : 'outline'}>
            {category}
          </Badge>
          {featured && <Badge className="bg-red-500">Featured</Badge>}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-gray-500">{date}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-700">{excerpt}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="p-0 hover:bg-transparent text-red-600" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the card click
            handleReadClick();
          }}
        >
          Read More <ArrowRight className="ml-1 h-4 w-4" />
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
      </CardFooter>
    </Card>
  );
};

export default NewsPreview;
