
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import RecentRelease from './RecentRelease';

interface TCGRelease {
  id: string;
  name: string;
  release_date: string;
  image_url?: string;
  popularity?: number;
  game?: string;
}

const RecentTCGSets = () => {
  const [recentSets, setRecentSets] = useState<TCGRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentReleases();
  }, []);

  const fetchRecentReleases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcg_recent_releases')
        .select('*')
        .order('release_date', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      setRecentSets(data || []);
    } catch (error) {
      console.error('Error fetching recent TCG sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-blue-700">Recent TCG Set Releases</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <p className="text-gray-500">Loading recent releases...</p>
          </div>
        ) : recentSets.length > 0 ? (
          <div className="space-y-1 overflow-hidden">
            {recentSets.map((set) => (
              <RecentRelease
                key={set.id}
                name={set.name}
                releaseDate={formatDate(set.release_date)}
                popularity={set.popularity || 50}
                imageUrl={set.image_url}
                game={set.game || "Pokémon"}
              />
            ))}
            <div className="mt-4">
              <Button 
                variant="ghost" 
                className="text-blue-600 hover:text-blue-800 p-0"
                onClick={() => navigate('/sets')}
              >
                View All TCG Sets <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent releases found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTCGSets;
