
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

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
}: NewsPreviewProps) => (
  <Card className={`transition-all h-full flex flex-col ${featured ? 'border-blue-300 shadow-md' : ''}`}>
    {image && (
      <div className="w-full h-48 overflow-hidden">
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
        {featured && <Badge className="bg-blue-500">Featured</Badge>}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="text-gray-500">{date}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-gray-700">{excerpt}</p>
    </CardContent>
    <CardFooter>
      <Button variant="ghost" className="p-0 hover:bg-transparent text-blue-600" onClick={onClick}>
        Read More <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </CardFooter>
  </Card>
);

export default NewsPreview;
