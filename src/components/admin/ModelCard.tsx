
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Save, Loader2 } from 'lucide-react';

interface ModelCardProps {
  id: string;
  title: string;
  onFileUpload: (id: string, file: File) => Promise<void>;
  isUploaded: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({ id, title, onFileUpload, isUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await onFileUpload(id, file);
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            {isUploaded ? (
              <div className="text-green-600 font-medium">
                Model uploaded successfully
              </div>
            ) : (
              <div className="text-gray-500">
                No model uploaded yet
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`file-${id}`}>Upload STL File</Label>
            <Input
              id={`file-${id}`}
              type="file"
              accept=".stl"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading} 
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Model
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModelCard;
