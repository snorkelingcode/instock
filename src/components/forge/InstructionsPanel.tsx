import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertCircle } from 'lucide-react';

interface InstructionsPanelProps {
  isAuthenticated?: boolean;
}

const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ isAuthenticated = false }) => {
  const isMobile = useIsMobile();
  
  return (
    <Card>
      <CardHeader className={isMobile ? "p-4 pb-2" : "p-6 pb-4"}>
        <CardTitle className={isMobile ? "text-lg" : "text-xl"}>How to Use the Forge</CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? "p-4 pt-2" : "p-6 pt-3"}`}>
        {isMobile && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 flex items-start">
            <AlertCircle className="text-orange-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-orange-800">Mobile Limitations</p>
              <p className="text-xs text-orange-700 mt-1">
                For the full 3D customization experience, please use a desktop computer. 
                Mobile devices can only view model previews.
              </p>
            </div>
          </div>
        )}
        
        <div>
          <h3 className={`${isMobile ? "text-base" : "text-lg"} font-medium mb-2`}>Getting Started</h3>
          <p className="text-gray-600 text-sm">
            The Forge allows you to customize 3D models for various purposes including 
            card displays, holders, and game accessories.
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className={`${isMobile ? "text-base" : "text-lg"} font-medium mb-2`}>Customization Options</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
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
          <h3 className={`${isMobile ? "text-base" : "text-lg"} font-medium mb-2`}>Interact with the Model</h3>
          <p className="text-gray-600 text-sm">
            {isMobile ? "Tap and drag" : "Click and drag"} on the model to rotate it and view from different angles.
          </p>
        </div>
        
        {isMobile && (
          <>
            <Separator />
            <div>
              <h3 className="text-base font-medium mb-2">Mobile Performance Tips</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                <li>Only one model loads at a time to improve performance</li>
                <li>Changing model types may take a moment to load</li>
                <li>If a model fails to load, try refreshing the page</li>
                <li>For best performance, use the latest version of your browser</li>
              </ul>
            </div>
          </>
        )}
        
        <Separator />
        
        <div>
          <h3 className={`${isMobile ? "text-base" : "text-lg"} font-medium mb-2`}>Save Your Designs</h3>
          {isAuthenticated ? (
            <p className="text-gray-600 text-sm">
              Click the "Save Customization" button to store your current design. 
              Your saved designs will be available whenever you return.
            </p>
          ) : (
            <p className="text-gray-600 text-sm">
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
