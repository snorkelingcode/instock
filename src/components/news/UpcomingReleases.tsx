
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { useUpcomingPokemonReleases } from '@/hooks/usePokemonReleases';
import EmptyStateHandler from '@/components/ui/empty-state-handler';

const UpcomingReleases = () => {
  const { releases, loading, error } = useUpcomingPokemonReleases();

  function calculateDaysUntil(dateString: string | null | undefined): number {
    if (!dateString) return 0;
    
    try {
      const releaseDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = releaseDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating days until release:', error);
      return 0;
    }
  }

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Unknown Date';
    
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown Date';
    }
  }

  function getBadgeColor(days: number): string {
    if (days < 0) return "bg-gray-400"; // Past
    if (days < 7) return "bg-red-500";  // Very soon
    if (days < 30) return "bg-yellow-500"; // Soon
    return "bg-green-500";  // Far away
  }

  // If there's an error, render a fallback UI
  if (error) {
    return (
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-blue-700">Upcoming Pokémon TCG Releases</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-4">Error loading upcoming releases. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-blue-700">Upcoming Pokémon TCG Releases</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyStateHandler
          isLoading={loading}
          hasItems={Array.isArray(releases) && releases.length > 0}
          loadingComponent={
            <div className="flex justify-center py-6">
              <p className="text-gray-500">Loading upcoming releases...</p>
            </div>
          }
          emptyComponent={
            <p className="text-gray-500 text-center py-4">No upcoming releases found.</p>
          }
        >
          <div className="space-y-4">
            {Array.isArray(releases) && releases.map((release) => {
              const daysUntil = calculateDaysUntil(release.release_date);
              return (
                <div key={release.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {release.name || 'Unknown Set'}
                        {release.image_url && (
                          <img 
                            src={release.image_url} 
                            alt={release.name || 'Set image'} 
                            className="w-6 h-6 inline-block ml-2"
                            onError={(e) => {
                              // Hide the image if it fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{formatDate(release.release_date)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{release.type || 'Standard Release'}</div>
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
        </EmptyStateHandler>
      </CardContent>
    </Card>
  );
};

export default UpcomingReleases;
