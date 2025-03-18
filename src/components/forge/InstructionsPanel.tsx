
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const InstructionsPanel: React.FC = () => {
  return (
    <Card className="w-full h-full">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">Instructions</h3>
        <ul className="space-y-2 text-sm">
          <li>• Rotate model: Click and drag</li>
          <li>• Zoom: Use mouse wheel or pinch gesture</li>
          <li>• Customize: Use the options in the side panel</li>
          <li>• Save your changes using the Save button</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default InstructionsPanel;
