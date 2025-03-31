
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
        <h1 className="text-2xl font-semibold leading-none tracking-tight text-red-800">Welcome to TCG Updates</h1>
        <CardDescription>Your comprehensive resource for Trading Card Game news and inventory tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">
          Stay informed with the latest news and market analysis for all major trading card games. 
          We track inventory across major retailers, monitor price trends, and provide detailed market statistics for collectors and investors.
        </p>
        <p className="text-gray-700">
          From product tracking with MSRP data to graded card analytics showing market cap and population reports - 
          we provide the essential tools for making informed decisions in the TCG market.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          onClick={() => navigate('/about')}
          variant="outline"
          className="border-red-300 hover:bg-red-50 text-red-700 transition-all duration-300 shadow-sm"
          size="sm"
        >
          <span>Learn More</span> 
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        <Button 
          onClick={() => navigate('/products')}
          className="bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-md"
          size="sm"
        >
          <span>Browse Products</span>
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WelcomeCard;
