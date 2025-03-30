
import React from 'react';
import { Bell, Search, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorksCard = () => {
  return (
    <Card className="bg-white border-red-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-red-800">How TCG Updates Works</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Search className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">News</h3>
              <p className="text-gray-600 text-sm">
                Stay informed with the latest TCG Updates for trading card game products. Every TCG Updates news article will contain information intended to help our users learn more about the latest events in the trading card game hobby. Our specific news categories (Market Analysis, Restocks, Product News, Release Dates, New Release, and Retailer Updates) are filterable in the TCG Updates "News" page. 
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Bell className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Product Tracking</h3>
              <p className="text-gray-600 text-sm">
                We track all of the major retailers, as well as some reputable hobby shops. Every product will have their MSRP listed the TCG Updates "Products" page, as well as the discount rate when applicable. We also track the last time we saw a product in stock. Providing never before tracked data on historic trading card inventory expirations.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Wrench className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Track Market Trends</h3>
              <p className="text-gray-600 text-sm">
                TCG Updates trackes several statistics for graded trading cards. Including market cap, population, gem rate, and more. This information provides collectors with a platform to research other trading cards on the market, and find opportunities. Visit TCG Updates "Market" page to start your research."
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksCard;
