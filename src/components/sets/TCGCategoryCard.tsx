
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TCGCategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link: string;
}

export const TCGCategoryCard: React.FC<TCGCategoryCardProps> = ({
  id,
  name,
  description,
  icon,
  color,
  link
}) => {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="w-full transition-all duration-300 hover:shadow-lg border-t-4 flex flex-col"
      style={{ borderTopColor: color }}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle>{name}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          View all {name} sets including pricing, release dates, and card details.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={() => navigate(link)} 
          className="w-full"
          style={{ backgroundColor: color }}
        >
          View Sets
        </Button>
      </CardFooter>
    </Card>
  );
};
