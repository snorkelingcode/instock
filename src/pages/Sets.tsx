
import React, { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { TCGCategoryCard } from "@/components/sets/TCGCategoryCard";
import { Layers, Sparkles, Zap, ScrollText } from "lucide-react";
import RecentTCGSets from "@/components/news/RecentTCGSets";
import UpcomingReleases from "@/components/news/UpcomingReleases";
import AdContainer from "@/components/ads/AdContainer";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { initPokemonCardPrefetching } from "@/utils/pokemon-cards";

const SetsPage = () => {
  useMetaTags({
    title: "TCG Card Sets | Browse Pokémon, Magic & Yu-Gi-Oh Collections",
    description: "Browse trading card game sets from Pokémon, Magic: The Gathering, Yu-Gi-Oh, and Disney Lorcana. View upcoming releases and recent additions to popular TCGs."
  });

  // Initialize prefetching when the Sets page loads
  useEffect(() => {
    // Common recent sets - consider prefetching these
    const recentSets = ['sv4', 'sv3pt5', 'sv3', 'sv2'];
    console.log("Initializing Pokemon sets prefetching from Sets page");
    initPokemonCardPrefetching(recentSets);
  }, []);

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
      
      {/* TCG Releases sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RecentTCGSets />
        <UpcomingReleases />
      </div>
      
      {/* Ad container at the bottom */}
      <AdContainer adSlot="5984712058" adFormat="horizontal" className="mb-8" />
    </Layout>
  );
};

export default SetsPage;
