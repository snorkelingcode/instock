
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowRight } from "lucide-react";

interface FeaturedNewsProps {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  image?: string;
  onClick?: () => void;
}

const FeaturedNews = ({ id, title, date, category, excerpt, image, onClick }: FeaturedNewsProps) => (
  <div className="bg-white rounded-lg shadow-md border border-blue-200 mb-8 overflow-hidden">
    <div className="md:flex">
      {image && (
        <div className="md:w-2/5 h-64 md:h-auto relative">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={`bg-gradient-to-r from-blue-50 to-white p-6 ${image ? 'md:w-3/5' : 'w-full'}`}>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="default" className="font-medium">{category}</Badge>
          <Badge className="bg-blue-500 hover:bg-blue-600">Featured Story</Badge>
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <div className="flex items-center text-gray-500 mb-4">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>{date}</span>
        </div>
        <div className="prose max-w-none text-gray-700 leading-relaxed mb-4">
          <p>{excerpt}</p>
        </div>
        <Button variant="ghost" className="p-0 hover:bg-transparent text-blue-600" onClick={onClick}>
          Read Full Article <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
);

export default FeaturedNews;
