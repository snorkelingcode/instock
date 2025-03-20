
import React from 'react';
import { Bell, Search, ListChecks, Wrench } from 'lucide-react';
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
                Stay informed with the latest TCG news and browse our comprehensive database of products across multiple games.
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
                Set up alerts for specific products, news topics, or upcoming releases to stay ahead of the curve.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-2 rounded-full">
              <Wrench className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Create & Customize</h3>
              <p className="text-gray-600 text-sm">
                Explore guides for DIY accessories, custom storage solutions, and ways to showcase your collection.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksCard;
