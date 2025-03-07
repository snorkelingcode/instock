
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SetCard from "@/components/sets/SetCard";
import { Sparkles } from "lucide-react";

interface MTGSet {
  id: number;
  set_id: string;
  name: string;
  code: string;
  release_date: string;
  set_type: string;
  card_count: number;
  icon_url: string;
  image_url: string;
}

const MTGSets = () => {
  const [sets, setSets] = useState<MTGSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('mtg_sets' as any)
          .select('*')
          .order('release_date', { ascending: false });

        if (error) {
          throw error;
        }

        setSets(data as MTGSet[] || []);
      } catch (error) {
        console.error('Error fetching MTG sets:', error);
        toast({
          title: "Error",
          description: "Failed to load Magic: The Gathering sets",
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
          <Sparkles className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold">Magic: The Gathering Sets</h1>
        </div>
        <p className="text-gray-700 mb-8">
          Browse all Magic: The Gathering card sets, sorted by release date. Click on a set to view more details.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-xl">Loading MTG sets...</div>
          </div>
        ) : sets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <SetCard
                key={set.set_id}
                id={set.set_id}
                name={set.name}
                imageUrl={set.image_url || set.icon_url}
                releaseDate={set.release_date}
                totalCards={set.card_count}
                description={`${set.set_type} • ${set.code} • ${set.card_count} Cards`}
                category="mtg"
                color="#3182CE"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No Magic: The Gathering sets found. Sets will appear here after the database is populated.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MTGSets;
