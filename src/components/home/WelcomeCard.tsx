
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
        <CardTitle className="text-2xl text-red-800">Welcome to TCG Updates</CardTitle>
        <CardDescription>Your comprehensive resource for Trading Card Game news, inventory tracking, and DIY accessories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose">
          <p className="text-gray-700">
            <strong>TCG Updates</strong> provides you with real-time information on product availability, 
            market trends, and latest news for all major trading card games. Whether you're a collector, 
            player, or investor, our platform helps you stay ahead with timely updates.
          </p>
          <p className="text-gray-700 mt-3">
            At <strong>TCG Updates</strong>, we track inventory across major retailers, monitor price 
            fluctuations in the secondary market, and provide detailed guides for DIY storage solutions 
            and display options for your valuable cards.
          </p>
          <p className="text-gray-700 mt-3">
            Join thousands of TCG enthusiasts who rely on <strong>TCG Updates</strong> for their daily 
            dose of trading card game information.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button 
          onClick={() => navigate('/about')}
          variant="outline"
          className="border-red-300 hover:bg-red-50 text-red-700 w-full transition-all duration-300 shadow-sm"
        >
          <span>Learn More About TCG Updates</span> 
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
