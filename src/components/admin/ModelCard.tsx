
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModelCardProps {
  id: string;
  title: string;
  onFileUpload: (modelId: string, file: File) => void;
  isUploaded: boolean;
  onDeleteModel?: (modelId: string) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ 
  id, 
  title, 
  onFileUpload, 
  isUploaded,
  onDeleteModel 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      onFileUpload(id, files[0]);
      
      // Reset uploading state after some time
      setTimeout(() => {
        setIsUploading(false);
      }, 3000);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDeleteModel) {
      onDeleteModel(id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center bg-gray-100 rounded-md">
            {isUploaded ? (
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle size={32} />
                <span className="mt-2 text-sm">Uploaded</span>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center text-blue-600">
                <div className="animate-spin">
                  <Upload size={32} />
                </div>
                <span className="mt-2 text-sm">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload size={32} />
                <span className="mt-2 text-sm">Upload STL</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById(`file-upload-${id}`)?.click()}
          >
            {isUploaded ? "Replace File" : "Upload File"}
          </Button>
          
          {isUploaded && onDeleteModel && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Model
            </Button>
          )}
          
          <input
            type="file"
            id={`file-upload-${id}`}
            accept=".stl"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {title} model. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ModelCard;
