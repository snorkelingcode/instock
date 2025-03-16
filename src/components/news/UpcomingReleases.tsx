
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { useUpcomingPokemonReleases } from '@/hooks/usePokemonReleases';

const UpcomingReleases = () => {
  const { releases, loading } = useUpcomingPokemonReleases();

  function calculateDaysUntil(dateString: string): number {
    const releaseDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = releaseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }

  function getBadgeColor(days: number): string {
    if (days < 0) return "bg-gray-400"; // Past
    if (days < 7) return "bg-red-500";  // Very soon
    if (days < 30) return "bg-yellow-500"; // Soon
    return "bg-green-500";  // Far away
  }

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-blue-700">Upcoming Pokémon TCG Releases</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <p className="text-gray-500">Loading upcoming releases...</p>
          </div>
        ) : releases.length > 0 ? (
          <div className="space-y-4">
            {releases.map((release) => {
              const daysUntil = calculateDaysUntil(release.release_date);
              return (
                <div key={release.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {release.name}
                        {release.image_url && (
                          <img 
                            src={release.image_url} 
                            alt={release.name} 
                            className="w-6 h-6 inline-block ml-2"
                          />
                        )}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{formatDate(release.release_date)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{release.type}</div>
                    </div>
                    <Badge 
                      className={getBadgeColor(daysUntil)}
                    >
                      {daysUntil < 0 
                        ? 'Released' 
                        : daysUntil === 0 
                          ? 'Today!' 
                          : `${daysUntil} day${daysUntil === 1 ? '' : 's'}`}
                    </Badge>
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
