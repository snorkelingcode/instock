
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Info, X } from 'lucide-react';

interface PokemonCardProps {
  card: {
    id: string;
    name: string;
    supertype: string;
    subtypes?: string[];
    level?: string;
    hp?: string;
    types?: string[];
    evolves_from?: string;
    rules?: string[];
    attacks?: {
      name: string;
      cost: string[];
      convertedEnergyCost: number;
      damage: string;
      text: string;
    }[];
    weaknesses?: {
      type: string;
      value: string;
    }[];
    resistances?: {
      type: string;
      value: string;
    }[];
    retreat_cost?: string[];
    number: string;
    artist?: string;
    rarity?: string;
    images: {
      small: string;
      large: string;
    };
    tcgplayer?: {
      url: string;
      updated_at: string;
      prices: Record<string, {
        low: number;
        mid: number;
        high: number;
        market: number;
        directLow?: number;
      }>;
    };
  };
}

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    Colorless: 'bg-gray-300',
    Darkness: 'bg-purple-900 text-white',
    Dragon: 'bg-yellow-500',
    Fairy: 'bg-pink-300',
    Fighting: 'bg-amber-700 text-white',
    Fire: 'bg-red-500 text-white',
    Grass: 'bg-green-500 text-white',
    Lightning: 'bg-yellow-400',
    Metal: 'bg-gray-500 text-white',
    Psychic: 'bg-purple-500 text-white',
    Water: 'bg-blue-500 text-white',
  };
  
  return colors[type] || 'bg-gray-300';
};

const formatPrice = (price?: number): string => {
  if (price === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const PokemonCardComponent: React.FC<PokemonCardProps> = ({ card }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const marketPrice = card.tcgplayer?.prices?.holofoil?.market 
    || card.tcgplayer?.prices?.normal?.market
    || card.tcgplayer?.prices?.reverseHolofoil?.market;
    
  const lowPrice = card.tcgplayer?.prices?.holofoil?.low 
    || card.tcgplayer?.prices?.normal?.low
    || card.tcgplayer?.prices?.reverseHolofoil?.low;

  // Ensure card.images exists to prevent null reference errors
  const cardImages = card.images || { small: '', large: '' };

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-4 pt-5 flex-grow flex flex-col">
        <div className="relative mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="font-medium text-sm line-clamp-1 mr-auto">{card.name}</h3>
          </div>
          <div className="text-xs text-gray-500">#{card.number}</div>
        </div>
        
        <div className="relative aspect-[2.5/3.5] bg-gray-100 rounded-md mb-3 overflow-hidden flex-grow">
          {!isImageLoaded && !isImageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
            </div>
          )}
          
          {!isImageError ? (
            <img
              src={cardImages.small}
              alt={card.name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
              Image not available
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {card.types?.map((type) => (
            <Badge key={type} className={`${getTypeColor(type)}`}>
              {type}
            </Badge>
          ))}
          
          {card.rarity && (
            <Badge variant="outline" className="ml-auto">
              {card.rarity}
            </Badge>
          )}
        </div>
        
        {card.tcgplayer?.prices && (
          <div className="text-xs mt-auto">
            <div className="flex justify-between">
              <span className="text-gray-500">Market:</span>
              <span className="font-medium">{formatPrice(marketPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Low:</span>
              <span>{formatPrice(lowPrice)}</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Info className="h-3.5 w-3.5 mr-1" />
              Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <div className="sticky top-0 bg-background z-10 border-b rounded-t-lg">
              <div className="flex items-center justify-between p-4">
                <DialogTitle className="text-lg">{card.name}</DialogTitle>
                <DialogClose asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="flex justify-center items-start">
                <img 
                  src={cardImages.large} 
                  alt={card.name} 
                  className="max-h-[300px] md:max-h-[400px] object-contain rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = cardImages.small || '';
                  }}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Card Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Number:</div>
                    <div>{card.number}</div>
                    
                    <div className="text-gray-500">Rarity:</div>
                    <div>{card.rarity || 'N/A'}</div>
                    
                    <div className="text-gray-500">Type:</div>
                    <div className="flex flex-wrap gap-1">
                      {card.types && card.types.length > 0 ? (
                        card.types.map(type => (
                          <Badge key={type} className={getTypeColor(type)}>
                            {type}
                          </Badge>
                        ))
                      ) : 'N/A'}
                    </div>
                    
                    <div className="text-gray-500">HP:</div>
                    <div>{card.hp || 'N/A'}</div>
                    
                    <div className="text-gray-500">Artist:</div>
                    <div>{card.artist || 'N/A'}</div>
                    
                    {card.evolves_from && (
                      <>
                        <div className="text-gray-500">Evolves From:</div>
                        <div>{card.evolves_from}</div>
                      </>
                    )}
                  </div>
                </div>
                
                {card.attacks && card.attacks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Attacks</h3>
                    <div className="space-y-2">
                      {card.attacks.map((attack, index) => (
                        <div key={index} className="border p-2 rounded-md">
                          <div className="flex justify-between">
                            <div className="font-medium">{attack.name}</div>
                            <div>{attack.damage || '-'}</div>
                          </div>
                          {attack.text && <div className="text-sm mt-1">{attack.text}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {card.tcgplayer?.prices && (
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Price Information</h3>
                    <div className="space-y-2">
                      {Object.entries(card.tcgplayer.prices).map(([variant, prices]) => (
                        <div key={variant} className="border rounded-md p-2">
                          <div className="font-medium capitalize mb-1">{variant}</div>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="text-gray-500">Market:</div>
                            <div>{formatPrice(prices.market)}</div>
                            
                            <div className="text-gray-500">Low:</div>
                            <div>{formatPrice(prices.low)}</div>
                            
                            <div className="text-gray-500">Mid:</div>
                            <div>{formatPrice(prices.mid)}</div>
                            
                            <div className="text-gray-500">High:</div>
                            <div>{formatPrice(prices.high)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {card.tcgplayer.url && (
                      <a 
                        href={card.tcgplayer.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm block mt-2 hover:underline"
                      >
                        Buy on TCGPlayer
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {card.tcgplayer?.url && (
          <a 
            href={card.tcgplayer.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="default" size="sm" className="w-full bg-red-500 hover:bg-red-600">
              Buy
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  );
};

export default PokemonCardComponent;
