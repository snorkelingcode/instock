
import React from 'react';
import { ArrowRight, Newspaper, ShoppingCart, TrendingUp } from 'lucide-react';
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
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Newspaper className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">News</h3>
              <p className="text-gray-600 text-sm">
                Stay informed with the latest TCG Updates for trading card game products. Our dedicated news coverage spans market analysis, restock alerts, product announcements, upcoming release dates, and retailer updates, all filterable on our News page to customize your information feed.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <ShoppingCart className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Product Tracking</h3>
              <p className="text-gray-600 text-sm">
                We track all major retailers and reputable hobby shops, providing comprehensive MSRP data and current discount rates when available. Our unique inventory tracking system records historical stock information, helping you understand product availability patterns and make informed purchasing decisions.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Market Trends</h3>
              <p className="text-gray-600 text-sm">
                Track essential statistics for graded cards including market capitalization, population reports, gem rates, and more. Our Market page provides collectors with powerful research tools to analyze trading card performance, identify market opportunities, and make data-driven collecting decisions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <div className="flex gap-2">
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
        </div>
      </CardFooter>
    </Card>
  );
};

export default WelcomeCard;
