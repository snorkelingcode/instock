
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SetCard from "@/components/sets/SetCard";
import { Gamepad } from "lucide-react";

interface PokemonSet {
  id: number;
  set_id: string;
  name: string;
  series: string;
  printed_total: number;
  total: number;
  release_date: string;
  symbol_url: string;
  logo_url: string;
  images_url: string;
}

const PokemonSets = () => {
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pokemon_sets')
          .select('*')
          .order('release_date', { ascending: false });

        if (error) {
          throw error;
        }

        setSets(data || []);
      } catch (error) {
        console.error('Error fetching Pokémon sets:', error);
        toast({
          title: "Error",
          description: "Failed to load Pokémon sets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [toast]);

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Gamepad className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold">Pokémon TCG Sets</h1>
        </div>
        <p className="text-gray-700 mb-8">
          Browse all Pokémon Trading Card Game sets, sorted by release date. Click on a set to view more details.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-xl">Loading Pokémon sets...</div>
          </div>
        ) : sets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <SetCard
                key={set.set_id}
                id={set.set_id}
                name={set.name}
                imageUrl={set.logo_url || set.images_url}
                releaseDate={set.release_date}
                totalCards={set.total || set.printed_total}
                description={`${set.series} Series • ${set.total || set.printed_total} Cards`}
                category="pokemon"
                color="#E53E3E"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No Pokémon sets found. Sets will appear here after the database is populated.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PokemonSets;
