
import React from 'react';
import { Bell, Search, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorksCard = () => {
  return (
    <Card className="bg-white border-blue-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-blue-800">How TCG In-Stock Tracker Works</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="mr-4 bg-blue-100 p-2 rounded-full">
              <Search className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Find Products</h3>
              <p className="text-gray-600 text-sm">
                Browse our comprehensive database of TCG products across multiple games and retailers.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-blue-100 p-2 rounded-full">
              <Bell className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Get Notifications</h3>
              <p className="text-gray-600 text-sm">
                Set up alerts for specific products and receive notifications when they come back in stock.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-blue-100 p-2 rounded-full">
              <ListChecks className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Stay Updated</h3>
              <p className="text-gray-600 text-sm">
                Keep track of upcoming releases and read the latest news from the TCG world.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksCard;
