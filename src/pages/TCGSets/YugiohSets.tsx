
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SetCard from "@/components/sets/SetCard";
import { Layers } from "lucide-react";

interface YugiohSet {
  id: number;
  set_id: string;
  name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date: string;
  set_image: string;
  set_type: string;
}

const YugiohSets = () => {
  const [sets, setSets] = useState<YugiohSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('yugioh_sets')
          .select('*')
          .order('tcg_date', { ascending: false });

        if (error) {
          throw error;
        }

        setSets(data as YugiohSet[] || []);
      } catch (error) {
        console.error('Error fetching Yu-Gi-Oh! sets:', error);
        toast({
          title: "Error",
          description: "Failed to load Yu-Gi-Oh! sets",
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
          <Layers className="h-8 w-8 text-yellow-500" />
          <h1 className="text-2xl font-bold">Yu-Gi-Oh! Sets</h1>
        </div>
        <p className="text-gray-700 mb-8">
          Browse all Yu-Gi-Oh! card sets, sorted by release date. Click on a set to view more details.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-xl">Loading Yu-Gi-Oh! sets...</div>
          </div>
        ) : sets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <SetCard
                key={set.set_id}
                id={set.set_id}
                name={set.name}
                imageUrl={set.set_image}
                releaseDate={set.tcg_date}
                totalCards={set.num_of_cards}
                description={`${set.set_type} • ${set.set_code} • ${set.num_of_cards} Cards`}
                category="yugioh"
                color="#D69E2E"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No Yu-Gi-Oh! sets found. Sets will appear here after the database is populated.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default YugiohSets;
