
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PokemonCard } from '@/utils/pokemon-cards';

interface PokemonCardComponentProps {
  card: PokemonCard;
  isSecretRare?: boolean;
}

const PokemonCardComponent: React.FC<PokemonCardComponentProps> = ({ card, isSecretRare = false }) => {
  // Determine rarity color
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
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      {isSecretRare && (
        <div className="absolute top-0 right-0 z-10 m-2">
          <Badge className="bg-yellow-500 text-xs font-bold">Secret Rare</Badge>
        </div>
      )}
      <div className="relative pb-[140%] overflow-hidden">
        <img
          src={card.images.large || card.images.small}
          alt={card.name}
          className="absolute inset-0 w-full h-full object-contain hover:scale-105 transition-transform duration-300 ease-in-out"
          loading="lazy"
        />
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm md:text-base truncate">{card.name}</h3>
            <p className="text-xs text-gray-500">{card.number}</p>
          </div>
          {card.rarity && (
            <Badge className={`${getRarityColor()} text-[0.65rem] ml-1 whitespace-nowrap`}>
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
    </Card>
  );
};

export default PokemonCardComponent;
