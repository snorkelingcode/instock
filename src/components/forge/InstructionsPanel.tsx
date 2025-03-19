
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface InstructionsPanelProps {
  isAuthenticated?: boolean;
}

const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ isAuthenticated = false }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Use the Forge</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Getting Started</h3>
          <p className="text-gray-600">
            The Forge allows you to customize 3D models for various purposes including 
            card displays, holders, and game accessories.
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Customization Options</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>
              <span className="font-medium">Model Type:</span> Select from different base models.
            </li>
            <li>
              <span className="font-medium">Corner Style:</span> Choose between rounded or sharp corners.
            </li>
            <li>
              <span className="font-medium">Magnet Options:</span> Add magnetic closures or attachments.
            </li>
            <li>
              <span className="font-medium">Color:</span> Personalize with your favorite color.
            </li>
            <li>
              <span className="font-medium">Scale:</span> Adjust the overall size of the model.
            </li>
            <li>
              <span className="font-medium">Material:</span> Select different material finishes.
            </li>
          </ul>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Interact with the Model</h3>
          <p className="text-gray-600">
            Click and drag on the model to rotate it and view from different angles.
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Save Your Designs</h3>
          {isAuthenticated ? (
            <p className="text-gray-600">
              Click the "Save Customization" button to store your current design. 
              Your saved designs will be available whenever you return.
            </p>
          ) : (
            <p className="text-gray-600">
              <Link to="/auth" className="text-red-600 hover:underline">Sign in</Link> to save your customizations and access them later.
              Without an account, your changes will be lost when you leave the page.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InstructionsPanel;
