
import React from 'react';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';

interface ImageCarouselProps {
  images: string[];
  title?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <div className="overflow-hidden rounded-md">
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
    </div>
  );
};

export default ImageCarousel;
