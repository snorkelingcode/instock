
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
              <h3 className="font-medium mb-1">Browse Products & News</h3>
              <p className="text-gray-600 text-sm">
                Stay informed with the latest TCG Updates for trading card game products.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Bell className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Get Notifications</h3>
              <p className="text-gray-600 text-sm">
                TCG Updates alerts you about specific products and upcoming releases.
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
                TCG Updates helps monitor market trends and inventory levels for your collection.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksCard;
