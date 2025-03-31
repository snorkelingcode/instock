
import React from 'react';
import { Newspaper, TrendingUp, Gift, ListOrdered } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorksCard = () => {
  return (
    <Card className="bg-white border-red-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-red-800">What We Do</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Newspaper className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">News</h3>
              <p className="text-gray-600 text-sm">
                Stay informed with the latest TCG Updates for trading card game products.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Market</h3>
              <p className="text-gray-600 text-sm">
                Find the market cap, population, and gem rate for your the best cards.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Gift className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">In-Stock Products</h3>
              <p className="text-gray-600 text-sm">
                TCG Updates monitors online retailers for In-Stock trading card game products.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <ListOrdered className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Set Lists</h3>
              <p className="text-gray-600 text-sm">
                View the set list for Pokemon, Magic the Gathering, and other trading card games.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksCard;
