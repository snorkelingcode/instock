
import React, { useState } from 'react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogClose
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  title?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title }) => {
  const [open, setOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setOpen(true);
  };

  return (
    <div className="my-8">
      {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <div 
                  className="overflow-hidden rounded-md cursor-pointer"
                  onClick={() => handleImageClick(index)}
                >
                  <img 
                    src={image} 
                    alt={`Image ${index + 1}`}
                    className="h-60 w-full object-cover transition-all hover:scale-105"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-end gap-2 mt-4">
          <CarouselPrevious className="relative static h-8 w-8 -translate-y-0 translate-x-0 left-0" />
          <CarouselNext className="relative static h-8 w-8 -translate-y-0 translate-x-0 right-0" />
        </div>
      </Carousel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] p-0 overflow-hidden">
          <DialogClose className="absolute right-4 top-4 z-10 bg-black/50 p-2 rounded-full">
            <X className="h-6 w-6 text-white" />
          </DialogClose>
          <Carousel className="w-full" defaultIndex={selectedImageIndex}>
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index} className="basis-full">
                  <div className="h-[80vh] flex items-center justify-center p-1">
                    <img 
                      src={image} 
                      alt={`Full view ${index + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-between w-full absolute bottom-4 px-6">
              <CarouselPrevious className="relative static h-10 w-10 -translate-y-0 translate-x-0 left-0 bg-black/50 text-white hover:bg-black/70" />
              <CarouselNext className="relative static h-10 w-10 -translate-y-0 translate-x-0 right-0 bg-black/50 text-white hover:bg-black/70" />
            </div>
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageCarousel;
