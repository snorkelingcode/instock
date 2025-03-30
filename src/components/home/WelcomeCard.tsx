
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const WelcomeCard = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="bg-gradient-to-r from-red-50 to-white border-red-200 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-red-800">Welcome to TCG Updates</CardTitle>
        <CardDescription>Your comprehensive resource for Trading Card Game news and inventory tracking</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <div className="prose">
          <p className="text-gray-700 text-sm">
            <strong>TCG Updates</strong> provides real-time information on product availability, 
            market trends, and latest news for all major trading card games. Whether you're a collector, 
            player, or investor, we help you stay ahead.
          </p>
          <p className="text-gray-700 mt-2 text-sm">
            Join thousands of TCG enthusiasts who rely on <strong>TCG Updates</strong> for their daily 
            card game information.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button 
          onClick={() => navigate('/about')}
          variant="outline"
          className="border-red-300 hover:bg-red-50 text-red-700 flex-1 transition-all duration-300 shadow-sm text-sm"
        >
          <span>Learn More</span> 
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
        <Button 
          onClick={() => navigate('/products')}
          className="bg-red-600 hover:bg-red-700 flex-1 transition-all duration-300 shadow-md text-sm"
        >
          <span>Browse Products</span>
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WelcomeCard;
