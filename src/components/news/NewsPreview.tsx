
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
  onClick?: () => void;
}

const NewsPreview = ({ 
  id, 
  title, 
  date, 
  category, 
  excerpt, 
  featured = false, 
  image,
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

  return (
    <Card 
      className={`transition-all h-full flex flex-col ${featured ? 'border-red-300 shadow-md' : ''} cursor-pointer hover:shadow-lg`}
      onClick={handleReadClick}
      role="button"
      aria-label={`View article: ${title}`}
    >
      {image && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
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
