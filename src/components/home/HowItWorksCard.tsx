
import React from 'react';
import { Bell, Search, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorksCard = () => {
  return (
    <Card className="bg-white border-red-200 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-red-800">How TCG Updates Works</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start">
          <div className="mr-3 bg-red-100 p-1.5 rounded-full">
            <Search className="h-4 w-4 text-red-700" />
          </div>
          <div>
            <h3 className="font-medium mb-0.5 text-sm">Browse Products & News</h3>
            <p className="text-gray-600 text-xs">
              Stay informed with the latest TCG Updates for trading card game products.
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="mr-3 bg-red-100 p-1.5 rounded-full">
            <Bell className="h-4 w-4 text-red-700" />
          </div>
          <div>
            <h3 className="font-medium mb-0.5 text-sm">Get Notifications</h3>
            <p className="text-gray-600 text-xs">
              TCG Updates alerts you about specific products and upcoming releases.
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="mr-3 bg-red-100 p-1.5 rounded-full">
            <Wrench className="h-4 w-4 text-red-700" />
          </div>
          <div>
            <h3 className="font-medium mb-0.5 text-sm">Create & Customize</h3>
            <p className="text-gray-600 text-xs">
              TCG Updates helps with DIY accessories and storage solutions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksCard;
