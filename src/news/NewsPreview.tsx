import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DiscoCardEffect from "@/components/DiscoCardEffect"; // Import the new component

// Updated news article preview with disco effect
const NewsPreview = ({ title, date, category, excerpt, featured = false, index = 0 }) => (
  <DiscoCardEffect index={index}>
    <Card className={`h-full transition-all ${featured ? 'border-blue-300' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-1">
          <Badge variant={category === 'Product News' ? 'default' : category === 'Release Dates' ? 'secondary' : 'outline'}>
            {category}
          </Badge>
          {featured && <Badge className="bg-blue-500">Featured</Badge>}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-gray-500">{date}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{excerpt}</p>
      </CardContent>
    </Card>
  </DiscoCardEffect>
);

export default NewsPreview;
