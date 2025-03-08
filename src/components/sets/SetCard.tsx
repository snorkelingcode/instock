
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarIcon } from "lucide-react";

interface SetCardProps {
  id: string;
  name: string;
  imageUrl?: string;
  releaseDate?: string;
  totalCards?: number;
  description: string;
  category: string;
  color: string;
}

const SetCard: React.FC<SetCardProps> = ({
  id,
  name,
  imageUrl,
  releaseDate,
  totalCards,
  description,
  category,
  color
}) => {
  const navigate = useNavigate();
  
  // Format date nicely if available
  const formattedDate = releaseDate 
    ? new Date(releaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';
  
  const handleViewDetails = () => {
    console.log(`Navigating to set details: category=${category}, id=${id}`);
    navigate(`/sets/${category}/${id}`);
  };
  
  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg border-t-4 overflow-hidden"
      style={{ borderTopColor: color }}>
      <div className="h-48 bg-gray-100 flex items-center justify-center relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${name} logo`} 
            className="h-full w-full object-contain p-4"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="text-gray-500 text-center p-4">No image available</div>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-2">{name}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        
        {totalCards && (
          <div className="text-sm text-gray-600">
            <span>{totalCards} cards</span>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleViewDetails} 
          className="w-full"
          style={{ backgroundColor: color }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SetCard;
