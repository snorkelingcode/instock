
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MousePointer, Sliders, Download, HelpCircle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";

const InstructionsPanel: React.FC = () => {
  const { user } = useAuth();

  return (
    <Card className="w-full h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-lg">How to Use the Modifier</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MousePointer className="h-4 w-4 mt-0.5 text-gray-600" />
              <p>Left-click and drag to rotate the model</p>
            </div>
            
            <div className="flex items-start gap-2">
              <Sliders className="h-4 w-4 mt-0.5 text-gray-600" />
              <p>Use the options panel to customize your model</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Download className="h-4 w-4 mt-0.5 text-gray-600" />
              <p>Click Download to save your customized model</p>
            </div>
            
            {!user && (
              <div className="flex items-start gap-2 pt-2 mt-2 border-t border-gray-200">
                <LogIn className="h-4 w-4 mt-0.5 text-red-600" />
                <p>
                  <Link to="/auth" className="text-red-600 hover:underline">
                    Sign in
                  </Link> to save your customizations for future use
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstructionsPanel;
