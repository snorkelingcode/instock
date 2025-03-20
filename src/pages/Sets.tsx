
import React from "react";
import Layout from "@/components/layout/Layout";
import { TCGCategoryCard } from "@/components/sets/TCGCategoryCard";
import { Layers, Sparkles, Zap, ScrollText } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";

const SetsPage = () => {
  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-2">Card Sets</h1>
        <p className="text-gray-700 mb-8">
          Explore our collection of trading card game sets from various popular TCGs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TCGCategoryCard 
            id="pokemon"
            name="Pokémon TCG"
            description="Browse Pokémon card sets from all generations"
            icon={<Zap className="h-6 w-6 text-red-500" />}
            color="#EF4444"
            link="/sets/pokemon"
          />
          
          <TCGCategoryCard 
            id="mtg"
            name="Magic: The Gathering"
            description="Explore MTG sets from across the multiverse"
            icon={<Sparkles className="h-6 w-6 text-blue-500" />}
            color="#3B82F6"
            link="/sets/mtg"
            comingSoon={true}
          />
          
          <TCGCategoryCard 
            id="yugioh"
            name="Yu-Gi-Oh!"
            description="Discover Yu-Gi-Oh! sets from throughout the years"
            icon={<Layers className="h-6 w-6 text-yellow-500" />}
            color="#F59E0B"
            link="/sets/yugioh"
            comingSoon={true}
          />
          
          <TCGCategoryCard 
            id="lorcana"
            name="Disney Lorcana"
            description="Browse the latest Disney Lorcana card sets"
            icon={<ScrollText className="h-6 w-6 text-purple-500" />}
            color="#8B5CF6"
            link="/sets/lorcana"
            comingSoon={true}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SetsPage;
