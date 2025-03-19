
import React from 'react';
import ModelPreviewCard from './ModelPreviewCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ModelPreview {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  type: 'slab-slider' | 'slab-loader';
}

interface ModelPreviewGridProps {
  previews: ModelPreview[];
}

const ModelPreviewGrid: React.FC<ModelPreviewGridProps> = ({ previews }) => {
  const slabSliderPreviews = previews.filter(preview => preview.type === 'slab-slider');
  const slabLoaderPreviews = previews.filter(preview => preview.type === 'slab-loader');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="slab-slider">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="slab-slider">Slab Slider Models</TabsTrigger>
          <TabsTrigger value="slab-loader">Slab Loader Models</TabsTrigger>
        </TabsList>
        
        <TabsContent value="slab-slider">
          <Card>
            <CardHeader>
              <CardTitle>Slab Slider Models</CardTitle>
              <CardDescription>
                Preview different variants of the Slab Slider model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {slabSliderPreviews.length > 0 ? (
                  slabSliderPreviews.map(preview => (
                    <ModelPreviewCard
                      key={preview.id}
                      title={preview.title}
                      description={preview.description}
                      imageUrl={preview.imageUrl}
                      downloadUrl={preview.downloadUrl}
                    />
                  ))
                ) : (
                  <p className="col-span-2 text-center py-6 text-gray-500">
                    No Slab Slider previews available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="slab-loader">
          <Card>
            <CardHeader>
              <CardTitle>Slab Loader Models</CardTitle>
              <CardDescription>
                Preview different variants of the Slab Loader model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {slabLoaderPreviews.length > 0 ? (
                  slabLoaderPreviews.map(preview => (
                    <ModelPreviewCard
                      key={preview.id}
                      title={preview.title}
                      description={preview.description}
                      imageUrl={preview.imageUrl}
                      downloadUrl={preview.downloadUrl}
                    />
                  ))
                ) : (
                  <p className="col-span-2 text-center py-6 text-gray-500">
                    No Slab Loader previews available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelPreviewGrid;
