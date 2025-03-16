
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const WelcomeCard = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="bg-gradient-to-r from-red-50 to-white border-red-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl text-red-800">Welcome to TCG In-Stock Tracker</CardTitle>
        <CardDescription>Your one-stop resource for Trading Card Game availability</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          Track in-stock status for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, and Disney Lorcana cards 
          across major retailers. Get notified when hard-to-find products become available and stay 
          updated with the latest TCG news and releases.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button 
          onClick={() => navigate('/about')}
          variant="outline"
          className="border-red-300 hover:bg-red-50 text-red-700 w-full transition-all duration-300 shadow-sm"
        >
          <span>Learn More</span> 
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        <Button 
          onClick={() => navigate('/products')}
          className="bg-red-600 hover:bg-red-700 w-full transition-all duration-300 shadow-md"
        >
          <span>Browse All Products</span>
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WelcomeCard;
