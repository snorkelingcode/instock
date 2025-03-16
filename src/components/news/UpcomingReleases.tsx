
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";

interface UpcomingRelease {
  id: string;
  name: string;
  date: string;
  days: number;
  type: string;
}

const UpcomingReleases = () => {
  // This could be fetched from an API, but for now we'll use mock data
  const upcomingReleases: UpcomingRelease[] = [
    {
      id: "1",
      name: "Temporal Forces",
      date: "2024-06-28",
      days: calculateDaysUntil("2024-06-28"),
      type: "Expansion"
    },
    {
      id: "2",
      name: "Pocket Monsters TCG: 151",
      date: "2024-07-12",
      days: calculateDaysUntil("2024-07-12"),
      type: "Special Set"
    },
    {
      id: "3",
      name: "Shrouded Fable",
      date: "2024-08-09",
      days: calculateDaysUntil("2024-08-09"),
      type: "Expansion"
    },
    {
      id: "4",
      name: "Paldean Fates",
      date: "2024-09-27",
      days: calculateDaysUntil("2024-09-27"),
      type: "Special Set"
    }
  ];

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
        <div className="space-y-4">
          {upcomingReleases.map((release) => (
            <div key={release.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{release.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>{formatDate(release.date)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{release.type}</div>
                </div>
                <Badge 
                  className={getBadgeColor(release.days)}
                >
                  {release.days < 0 
                    ? 'Released' 
                    : release.days === 0 
                      ? 'Today!' 
                      : `${release.days} day${release.days === 1 ? '' : 's'}`}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingReleases;
