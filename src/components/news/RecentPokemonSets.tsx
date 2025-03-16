
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { usePokemonSets } from '@/hooks/useTCGSets';
import RecentRelease from './RecentRelease';

const RecentPokemonSets = () => {
  const { sets, loading } = usePokemonSets({ cacheTime: 60 });
  const navigate = useNavigate();
  const [recentSets, setRecentSets] = useState<any[]>([]);

  useEffect(() => {
    if (sets && sets.length > 0) {
      // Sort by release date (newest first) and take the first 4
      const sorted = [...sets]
        .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
        .slice(0, 4);
      
      setRecentSets(sorted);
    }
  }, [sets]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate a popularity score (just for display purposes)
  const calculatePopularity = (set: any) => {
    // Mock popularity based on recency
    const releaseDate = new Date(set.release_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - releaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Newer sets are more popular, with a decay over time
    return Math.max(5, Math.min(95, 100 - (diffDays * 0.5)));
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-blue-700">Recent Pokémon Set Releases</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <p className="text-gray-500">Loading recent releases...</p>
          </div>
        ) : recentSets.length > 0 ? (
          <div className="space-y-1">
            {recentSets.map((set) => (
              <RecentRelease
                key={set.id}
                name={set.name}
                releaseDate={formatDate(set.release_date)}
                popularity={calculatePopularity(set)}
                imageUrl={set.logo_url || set.images_url || set.symbol_url}
              />
            ))}
            <div className="mt-4">
              <Button 
                variant="ghost" 
                className="text-blue-600 hover:text-blue-800 p-0"
                onClick={() => navigate('/sets/pokemon')}
              >
                View All Pokémon Sets <ArrowRight className="ml-1 h-4 w-4" />
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

export default RecentPokemonSets;
