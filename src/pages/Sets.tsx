
import React from "react";
import Layout from "@/components/layout/Layout";
import { TCGCategoryCard } from "@/components/sets/TCGCategoryCard";
import { Grid } from "@/components/ui/grid";
import { Layers, Gamepad, Cards, Sparkles } from "lucide-react";

const SetsPage = () => {
  const tcgCategories = [
    {
      id: "pokemon",
      name: "Pokémon",
      description: "Collect, train and battle with your favorite Pokémon characters.",
      icon: <Gamepad className="h-8 w-8 text-red-500" />,
      color: "#E53E3E", // Red shade
      link: "/sets/pokemon"
    },
    {
      id: "mtg",
      name: "Magic: The Gathering",
      description: "The original trading card game with powerful spells and creatures.",
      icon: <Sparkles className="h-8 w-8 text-blue-500" />,
      color: "#3182CE", // Blue shade
      link: "/sets/mtg"
    },
    {
      id: "yugioh",
      name: "Yu-Gi-Oh!",
      description: "Summon monsters and cast spells in this strategic dueling game.",
      icon: <Layers className="h-8 w-8 text-yellow-500" />,
      color: "#D69E2E", // Yellow shade
      link: "/sets/yugioh"
    },
    {
      id: "lorcana",
      name: "Disney Lorcana",
      description: "Collect and play with iconic Disney characters in this new TCG.",
      icon: <Cards className="h-8 w-8 text-purple-500" />,
      color: "#805AD5", // Purple shade
      link: "/sets/lorcana"
    }
  ];

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-2">Trading Card Game Sets</h1>
        <p className="text-gray-700 mb-8">
          Explore sets from your favorite trading card games. View comprehensive information about each set including release dates, card counts, and more.
        </p>
        
        <Grid className="grid-cols-1 md:grid-cols-2 gap-6">
          {tcgCategories.map((category) => (
            <TCGCategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              description={category.description}
              icon={category.icon}
              color={category.color}
              link={category.link}
            />
          ))}
        </Grid>
      </div>
    </Layout>
  );
};

export default SetsPage;
