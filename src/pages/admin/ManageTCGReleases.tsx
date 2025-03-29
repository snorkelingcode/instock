
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, PlusCircle, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface TCGRelease {
  id: string;
  name: string;
  release_date: string;
  image_url?: string;
  type?: string;
  popularity?: number;
  game?: string;
  created_at: string;
  updated_at: string;
}

const ManageTCGReleases = () => {
  const [recentReleases, setRecentReleases] = useState<TCGRelease[]>([]);
  const [upcomingReleases, setUpcomingReleases] = useState<TCGRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRelease, setNewRelease] = useState({
    name: '',
    release_date: '',
    image_url: '',
    type: 'expansion',
    popularity: 50,
    game: 'Pokémon'
  });
  const [releaseType, setReleaseType] = useState<'recent' | 'upcoming'>('recent');
  const { toast } = useToast();

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    setLoading(true);
    try {
      // Fetch recent releases
      const { data: recentData, error: recentError } = await supabase
        .from('pokemon_recent_releases')
        .select('*')
        .order('release_date', { ascending: false });
      
      if (recentError) throw recentError;
      
      // Fetch upcoming releases
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('pokemon_upcoming_releases')
        .select('*')
        .order('release_date', { ascending: true });
      
      if (upcomingError) throw upcomingError;
      
      setRecentReleases(recentData || []);
      setUpcomingReleases(upcomingData || []);
    } catch (error) {
      console.error('Error fetching TCG releases:', error);
      toast({
        title: "Error",
        description: "Failed to fetch TCG releases.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRelease(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRelease = async () => {
    try {
      if (!newRelease.name || !newRelease.release_date) {
        toast({
          title: "Validation Error",
          description: "Name and release date are required.",
          variant: "destructive"
        });
        return;
      }

      const table = releaseType === 'recent' ? 'pokemon_recent_releases' : 'pokemon_upcoming_releases';
      const { data, error } = await supabase
        .from(table)
        .insert([
          {
            name: newRelease.name,
            release_date: newRelease.release_date,
            image_url: newRelease.image_url || null,
            ...(releaseType === 'recent' ? { popularity: newRelease.popularity } : { type: newRelease.type }),
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: `New ${releaseType} release added successfully.`,
      });

      // Reset form and refresh data
      setNewRelease({
        name: '',
        release_date: '',
        image_url: '',
        type: 'expansion',
        popularity: 50,
        game: 'Pokémon'
      });
      fetchReleases();
    } catch (error) {
      console.error('Error adding release:', error);
      toast({
        title: "Error",
        description: "Failed to add new release.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRelease = async (id: string, type: 'recent' | 'upcoming') => {
    try {
      const table = type === 'recent' ? 'pokemon_recent_releases' : 'pokemon_upcoming_releases';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Release deleted successfully.",
      });

      // Refresh data
      fetchReleases();
    } catch (error) {
      console.error('Error deleting release:', error);
      toast({
        title: "Error",
        description: "Failed to delete release.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Manage TCG Releases</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Add New Release Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add New TCG Release</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Select 
                    value={releaseType} 
                    onValueChange={(value: 'recent' | 'upcoming') => setReleaseType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Release Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent Release</SelectItem>
                      <SelectItem value="upcoming">Upcoming Release</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    name="name"
                    value={newRelease.name}
                    onChange={handleInputChange}
                    placeholder="Set name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Release Date</label>
                  <Input
                    name="release_date"
                    type="date"
                    value={newRelease.release_date}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <Input
                    name="image_url"
                    value={newRelease.image_url}
                    onChange={handleInputChange}
                    placeholder="Image URL"
                  />
                </div>
                
                {releaseType === 'recent' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Popularity (0-100)</label>
                    <Input
                      name="popularity"
                      type="number"
                      min="0"
                      max="100"
                      value={newRelease.popularity}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <Input
                      name="type"
                      value={newRelease.type}
                      onChange={handleInputChange}
                      placeholder="Expansion, Special Set, etc."
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Game</label>
                  <Select 
                    value={newRelease.game} 
                    onValueChange={(value) => setNewRelease(prev => ({ ...prev, game: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Game" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pokémon">Pokémon</SelectItem>
                      <SelectItem value="Magic: The Gathering">Magic: The Gathering</SelectItem>
                      <SelectItem value="Yu-Gi-Oh!">Yu-Gi-Oh!</SelectItem>
                      <SelectItem value="Disney Lorcana">Disney Lorcana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleAddRelease} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add {releaseType === 'recent' ? 'Recent' : 'Upcoming'} Release
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Management Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Management Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm">
                <p>This page allows you to manage TCG set releases that appear on the website. You can:</p>
                <ul>
                  <li>Add new recent or upcoming releases</li>
                  <li>View existing releases</li>
                  <li>Delete releases that are no longer needed</li>
                </ul>
                <p><strong>Recent Releases:</strong> Sets that have already been released. These will appear in the "Recent TCG Set Releases" section.</p>
                <p><strong>Upcoming Releases:</strong> Sets that are scheduled to be released in the future. These will appear in the "Upcoming TCG Releases" section.</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={fetchReleases} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Releases Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent TCG Releases</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Loading recent releases...</p>
            ) : recentReleases.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Release Date</TableHead>
                      <TableHead>Popularity</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReleases.map((release) => (
                      <TableRow key={release.id}>
                        <TableCell className="font-medium">{release.name}</TableCell>
                        <TableCell>{formatDate(release.release_date)}</TableCell>
                        <TableCell>{release.popularity || 'N/A'}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(release.created_at), { addSuffix: true })}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteRelease(release.id, 'recent')}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-4">No recent releases found.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Upcoming Releases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming TCG Releases</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Loading upcoming releases...</p>
            ) : upcomingReleases.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Release Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingReleases.map((release) => (
                      <TableRow key={release.id}>
                        <TableCell className="font-medium">{release.name}</TableCell>
                        <TableCell>{formatDate(release.release_date)}</TableCell>
                        <TableCell>{release.type || 'N/A'}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(release.created_at), { addSuffix: true })}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteRelease(release.id, 'upcoming')}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-4">No upcoming releases found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManageTCGReleases;
