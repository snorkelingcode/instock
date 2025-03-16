
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import RecentRelease from './RecentRelease';
import { useRecentPokemonReleases } from '@/hooks/usePokemonReleases';

const RecentPokemonSets = () => {
  const { releases, loading } = useRecentPokemonReleases();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
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
        ) : releases && releases.length > 0 ? (
          <div className="space-y-1">
            {releases.map((release) => (
              <RecentRelease
                key={release.id}
                name={release.name || 'Unknown Set'}
                releaseDate={formatDate(release.release_date) || 'Unknown Date'}
                popularity={release.popularity || 0}
                imageUrl={release.image_url || release.logo_url}
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
