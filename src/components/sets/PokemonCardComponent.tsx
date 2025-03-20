
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PokemonCard } from '@/utils/pokemon-cards';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, ShoppingCart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface PokemonCardComponentProps {
  card: PokemonCard;
  isSecretRare?: boolean;
  priority?: boolean; // For prioritizing initial images
  index?: number; // Card index for staggered animation
}

const PokemonCardComponent: React.FC<PokemonCardComponentProps> = ({ 
  card, 
  isSecretRare = false,
  priority = false,
  index = 0
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  useEffect(() => {
    setImageSrc(card.images.small || card.images.large);
  }, [card.images.small, card.images.large]);
  
  const getRarityColor = () => {
    if (!card.rarity) return "bg-gray-500";
    
    const normalizedRarity = card.rarity.toLowerCase();
    
    if (normalizedRarity.includes('common')) return "bg-gray-500";
    if (normalizedRarity.includes('uncommon')) return "bg-green-500";
    if (normalizedRarity.includes('rare')) return "bg-blue-500";
    if (normalizedRarity.includes('ultra')) return "bg-purple-600";
    if (normalizedRarity.includes('secret')) return "bg-yellow-500";
    if (normalizedRarity.includes('hyper')) return "bg-rose-500";
    if (normalizedRarity.includes('amazing')) return "bg-cyan-500";
    if (normalizedRarity.includes('radiant')) return "bg-amber-500";
    if (normalizedRarity.includes('promo')) return "bg-orange-500";
    
    return "bg-blue-500";
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleBuyClick = () => {
    if (card.tcgplayer?.url) {
      window.open(card.tcgplayer.url, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Completely rewritten to avoid any TypeScript errors
  const getSetName = (): string => {
    try {
      // Safely extract the set name using optional chaining and type guards
      if (!card) return 'Unknown Set';
      
      // Handle string case
      if (typeof card.set === 'string') {
        return card.set;
      }
      
      // Handle object case
      if (card.set && typeof card.set === 'object') {
        // @ts-ignore - we'll handle this safely
        const name = card.set.name;
        if (typeof name === 'string') {
          return name;
        }
      }
      
      // If we reach here, use a fallback
      return 'Unknown Set';
    } catch (error) {
      // Ultimate fallback in case anything goes wrong
      console.error('Error getting set name:', error);
      return 'Unknown Set';
    }
  };
  
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.8, 
        rotateY: 180, 
        y: 20 
      }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotateY: 0, 
        y: 0 
      }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.1,
        duration: 0.6
      }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group flex flex-col h-full">
        {isSecretRare && (
          <div className="absolute top-0 right-0 z-10 m-2">
            <Badge className="bg-yellow-500 text-xs font-bold">Secret Rare</Badge>
          </div>
        )}
        <div className="relative pb-[140%] overflow-hidden bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-t-2 border-gray-300 rounded-full animate-spin"></div>
            </div>
          )}
          {imageSrc && (
            <img
              src={imageSrc}
              alt={card.name}
              className={`absolute inset-0 w-full h-full object-contain hover:scale-105 transition-transform duration-300 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading={priority ? "eager" : "lazy"}
              onLoad={handleImageLoad}
              decoding={priority ? "sync" : "async"}
            />
          )}
        </div>
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-sm md:text-base truncate">{card.name}</h3>
              <p className="text-xs text-gray-500">{card.number}</p>
            </div>
            {card.rarity && (
              <Badge className={`${getRarityColor()} text-xs ml-1 whitespace-nowrap`}>
                {card.rarity}
              </Badge>
            )}
          </div>
          
          {card.tcgplayer?.prices && (
            <div className="mt-2 text-xs space-y-1">
              {Object.entries(card.tcgplayer.prices).map(([priceType, prices]) => (
                <div key={priceType} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{priceType.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">${prices.market ? prices.market.toFixed(2) : '-'}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-3 pt-0 mt-auto">
          <div className="w-full flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Info className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {card.name}
                    {card.rarity && (
                      <Badge className={`${getRarityColor()} text-xs ml-1`}>
                        {card.rarity}
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <div className="sm:w-1/2">
                    <img 
                      src={card.images.large || card.images.small} 
                      alt={card.name} 
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div className="sm:w-1/2 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">Card Information</h3>
                      <p className="text-sm">Set: {getSetName()}</p>
                      <p className="text-sm">Number: {card.number}</p>
                      {card.types && <p className="text-sm">Type: {card.types.join(', ')}</p>}
                      {card.artist && <p className="text-sm">Artist: {card.artist}</p>}
                    </div>
                    
                    {card.tcgplayer?.prices && (
                      <div>
                        <h3 className="text-sm font-semibold flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Market Prices
                        </h3>
                        <div className="space-y-1 mt-1">
                          {Object.entries(card.tcgplayer.prices).map(([priceType, prices]) => (
                            <div key={priceType} className="flex justify-between text-sm">
                              <span className="text-gray-600 capitalize">{priceType.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">${prices.market ? prices.market.toFixed(2) : '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {card.tcgplayer?.url && (
                      <Button 
                        className="w-full" 
                        onClick={handleBuyClick}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy on TCGPlayer
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {card.tcgplayer?.url && (
              <Button variant="default" size="sm" className="flex-1" onClick={handleBuyClick}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PokemonCardComponent;
