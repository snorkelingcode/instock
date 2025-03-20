
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
  onClick?: () => void;
}

const FeaturedNews = ({ id, title, date, category, excerpt, image, onClick }: FeaturedNewsProps) => {
  const navigate = useNavigate();
  
  const handleReadClick = () => {
    if (onClick) onClick();
    else navigate(`/article/${id}`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md border border-red-200 overflow-hidden">
      <div className="md:flex">
        {image && (
          <div className="md:w-2/5 h-48 md:h-auto relative overflow-hidden bg-red-50">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`bg-gradient-to-r from-red-50 to-white p-5 ${image ? 'md:w-3/5' : 'w-full'}`}>
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
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="p-0 hover:bg-transparent text-red-600" onClick={handleReadClick}>
              Read Full Article <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600" 
              onClick={handleReadClick}
              aria-label="Go to article to use read aloud feature"
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
