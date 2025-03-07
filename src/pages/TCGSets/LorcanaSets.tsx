
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SetCard from "@/components/sets/SetCard";
import { ScrollText } from "lucide-react";

interface LorcanaSet {
  id: number;
  set_id: string;
  name: string;
  release_date: string;
  set_code: string;
  total_cards: number;
  set_image: string;
  set_type: string;
}

const LorcanaSets = () => {
  const [sets, setSets] = useState<LorcanaSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lorcana_sets' as any)
          .select('*')
          .order('release_date', { ascending: false });

        if (error) {
          throw error;
        }

        setSets((data || []) as LorcanaSet[]);
      } catch (error) {
        console.error('Error fetching Disney Lorcana sets:', error);
        toast({
          title: "Error",
          description: "Failed to load Disney Lorcana sets",
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
          <ScrollText className="h-8 w-8 text-purple-500" />
          <h1 className="text-2xl font-bold">Disney Lorcana Sets</h1>
        </div>
        <p className="text-gray-700 mb-8">
          Browse all Disney Lorcana card sets, sorted by release date. Click on a set to view more details.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-xl">Loading Disney Lorcana sets...</div>
          </div>
        ) : sets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <SetCard
                key={set.set_id}
                id={set.set_id}
                name={set.name}
                imageUrl={set.set_image}
                releaseDate={set.release_date}
                totalCards={set.total_cards}
                description={`${set.set_type || "Main Set"} • ${set.set_code} • ${set.total_cards} Cards`}
                category="lorcana"
                color="#805AD5"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No Disney Lorcana sets found. Sets will appear here after the database is populated.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LorcanaSets;
