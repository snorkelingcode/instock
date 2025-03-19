
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ModelPreviewCardProps {
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
}

const ModelPreviewCard: React.FC<ModelPreviewCardProps> = ({
  title,
  description,
  imageUrl,
  downloadUrl
}) => {
  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <div className="px-4">
        <div className="h-48 overflow-hidden rounded-md bg-gray-100">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback for broken images
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Model+Preview';
            }}
          />
        </div>
      </div>
      <CardContent className="p-4 pt-3">
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center" 
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Download STL
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModelPreviewCard;
