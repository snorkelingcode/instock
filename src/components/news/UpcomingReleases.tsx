
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface UpcomingRelease {
  id: string;
  name: string;
  release_date: string;
  image_url?: string;
  type?: string;
  game?: string;
}

const UpcomingReleases = () => {
  const [releases, setReleases] = useState<UpcomingRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingReleases();
  }, []);

  const fetchUpcomingReleases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pokemon_upcoming_releases')
        .select('*')
        .order('release_date', { ascending: true })
        .limit(4);
      
      if (error) throw error;
      
      // Transform the data to match UpcomingRelease interface
      const transformedData: UpcomingRelease[] = data?.map(item => ({
        id: item.id,
        name: item.name,
        release_date: item.release_date,
        image_url: item.image_url,
        type: item.type,
        game: 'Pokémon'
      })) || [];
      
      setReleases(transformedData);
    } catch (error) {
      console.error('Error fetching upcoming releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const calculateDaysRemaining = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const releaseDate = new Date(dateString);
    releaseDate.setHours(0, 0, 0, 0);
    
    const diffTime = releaseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-blue-700">Upcoming TCG Releases</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <p className="text-gray-500">Loading upcoming releases...</p>
          </div>
        ) : releases.length > 0 ? (
          <div className="space-y-4">
            {releases.map((release) => {
              const daysRemaining = calculateDaysRemaining(release.release_date);
              
              return (
                <div key={release.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{release.name}</h3>
                      <div className="flex items-center text-gray-500 mt-1 text-sm">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>{formatDate(release.release_date)}</span>
                      </div>
                      {release.type && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {release.type}
                        </Badge>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{release.game || "TCG"}</div>
                    </div>
                    <div>
                      {daysRemaining > 0 ? (
                        <Badge className="bg-amber-500">
                          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                        </Badge>
                      ) : daysRemaining === 0 ? (
                        <Badge className="bg-green-500">
                          Releases today!
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-300">
                          Released
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No upcoming releases found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingReleases;
