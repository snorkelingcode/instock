
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface UpcomingRelease {
  id: string;
  name: string;
  release_date: string;
  type: string;
  image_url?: string;
  game?: string;
}

const UpcomingReleases = () => {
  const [upcomingReleases, setUpcomingReleases] = useState<UpcomingRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingReleases();
  }, []);

  const fetchUpcomingReleases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcg_upcoming_releases')
        .select('*')
        .order('release_date', { ascending: true })
        .limit(4);
      
      if (error) throw error;
      setUpcomingReleases(data || []);
    } catch (error) {
      console.error('Error fetching upcoming releases:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <CardTitle className="text-xl text-blue-700">Upcoming TCG Releases</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <p className="text-gray-500">Loading upcoming releases...</p>
          </div>
        ) : upcomingReleases.length > 0 ? (
          <div className="space-y-4">
            {upcomingReleases.map((release) => {
              const days = calculateDaysUntil(release.release_date);
              return (
                <div key={release.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      {release.image_url && (
                        <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={release.image_url} 
                            alt={release.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/475569?text=TCG";
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{release.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>{formatDate(release.release_date)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {release.game ? `${release.game} ${release.type || "Expansion"}` : release.type || "Expansion"}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={getBadgeColor(days)}
                    >
                      {days < 0 
                        ? 'Released' 
                        : days === 0 
                          ? 'Today!' 
                          : `${days} day${days === 1 ? '' : 's'}`}
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
