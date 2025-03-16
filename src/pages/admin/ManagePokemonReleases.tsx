
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, PenSquare, Trash2, Calendar } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useMetaTags } from "@/hooks/use-meta-tags";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PokemonRelease {
  id: string;
  name: string;
  release_date: string;
  image_url?: string;
  popularity?: number;
  created_at: string;
}

interface UpcomingRelease {
  id: string;
  name: string;
  release_date: string;
  type: string;
  image_url?: string;
  created_at: string;
}

const ManagePokemonReleases = () => {
  const [recentReleases, setRecentReleases] = useState<PokemonRelease[]>([]);
  const [upcomingReleases, setUpcomingReleases] = useState<UpcomingRelease[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  
  // Form state for recent releases
  const [recentFormData, setRecentFormData] = useState({
    id: "",
    name: "",
    release_date: "",
    image_url: "",
    popularity: 50
  });
  
  // Form state for upcoming releases
  const [upcomingFormData, setUpcomingFormData] = useState({
    id: "",
    name: "",
    release_date: "",
    type: "Expansion",
    image_url: ""
  });
  
  const [isSubmittingRecent, setIsSubmittingRecent] = useState(false);
  const [isSubmittingUpcoming, setIsSubmittingUpcoming] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  useMetaTags({
    title: "Manage Pokémon Releases | Admin Dashboard",
    description: "Manage recent and upcoming Pokémon TCG releases"
  });

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    fetchRecentReleases();
    fetchUpcomingReleases();
  }, [isAdmin]);

  const fetchRecentReleases = async () => {
    setIsLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from('pokemon_recent_releases')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) throw error;
      setRecentReleases(data || []);
    } catch (error: any) {
      console.error("Error fetching recent releases:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load recent releases",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const fetchUpcomingReleases = async () => {
    setIsLoadingUpcoming(true);
    try {
      const { data, error } = await supabase
        .from('pokemon_upcoming_releases')
        .select('*')
        .order('release_date', { ascending: true });

      if (error) throw error;
      setUpcomingReleases(data || []);
    } catch (error: any) {
      console.error("Error fetching upcoming releases:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load upcoming releases",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  const resetRecentForm = () => {
    setRecentFormData({
      id: "",
      name: "",
      release_date: "",
      image_url: "",
      popularity: 50
    });
  };

  const resetUpcomingForm = () => {
    setUpcomingFormData({
      id: "",
      name: "",
      release_date: "",
      type: "Expansion",
      image_url: ""
    });
  };

  const handleRecentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecentFormData(prev => ({
      ...prev,
      [name]: name === "popularity" ? parseInt(value) : value
    }));
  };

  const handleUpcomingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpcomingFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRecentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRecent(true);
    
    try {
      const releaseDate = new Date(recentFormData.release_date);
      
      if (!recentFormData.name || !recentFormData.release_date) {
        throw new Error("Name and release date are required");
      }
      
      if (isNaN(releaseDate.getTime())) {
        throw new Error("Invalid release date");
      }
      
      const payload = {
        name: recentFormData.name,
        release_date: recentFormData.release_date,
        image_url: recentFormData.image_url || null,
        popularity: recentFormData.popularity || 50
      };
      
      if (recentFormData.id) {
        // Update existing release
        const { error } = await supabase
          .from('pokemon_recent_releases')
          .update(payload)
          .eq('id', recentFormData.id);
          
        if (error) throw error;
        
        toast({
          title: "Release Updated",
          description: "Recent release has been updated successfully",
        });
      } else {
        // Create new release
        const { error } = await supabase
          .from('pokemon_recent_releases')
          .insert([payload]);
          
        if (error) throw error;
        
        toast({
          title: "Release Created",
          description: "New recent release has been created successfully",
        });
      }
      
      resetRecentForm();
      fetchRecentReleases();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving recent release:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save recent release",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRecent(false);
    }
  };

  const handleUpcomingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUpcoming(true);
    
    try {
      const releaseDate = new Date(upcomingFormData.release_date);
      
      if (!upcomingFormData.name || !upcomingFormData.release_date) {
        throw new Error("Name and release date are required");
      }
      
      if (isNaN(releaseDate.getTime())) {
        throw new Error("Invalid release date");
      }
      
      const payload = {
        name: upcomingFormData.name,
        release_date: upcomingFormData.release_date,
        type: upcomingFormData.type,
        image_url: upcomingFormData.image_url || null
      };
      
      if (upcomingFormData.id) {
        // Update existing release
        const { error } = await supabase
          .from('pokemon_upcoming_releases')
          .update(payload)
          .eq('id', upcomingFormData.id);
          
        if (error) throw error;
        
        toast({
          title: "Release Updated",
          description: "Upcoming release has been updated successfully",
        });
      } else {
        // Create new release
        const { error } = await supabase
          .from('pokemon_upcoming_releases')
          .insert([payload]);
          
        if (error) throw error;
        
        toast({
          title: "Release Created",
          description: "New upcoming release has been created successfully",
        });
      }
      
      resetUpcomingForm();
      fetchUpcomingReleases();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving upcoming release:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save upcoming release",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingUpcoming(false);
    }
  };

  const editRecentRelease = (release: PokemonRelease) => {
    setActiveTab("recent");
    setRecentFormData({
      id: release.id,
      name: release.name,
      release_date: release.release_date,
      image_url: release.image_url || "",
      popularity: release.popularity || 50
    });
    setIsDialogOpen(true);
  };

  const editUpcomingRelease = (release: UpcomingRelease) => {
    setActiveTab("upcoming");
    setUpcomingFormData({
      id: release.id,
      name: release.name,
      release_date: release.release_date,
      type: release.type || "Expansion",
      image_url: release.image_url || ""
    });
    setIsDialogOpen(true);
  };

  const deleteRecentRelease = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pokemon_recent_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Release Deleted",
        description: "Recent release has been deleted successfully",
      });
      
      fetchRecentReleases();
    } catch (error: any) {
      console.error("Error deleting recent release:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete recent release",
        variant: "destructive",
      });
    }
  };

  const deleteUpcomingRelease = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pokemon_upcoming_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Release Deleted",
        description: "Upcoming release has been deleted successfully",
      });
      
      fetchUpcomingReleases();
    } catch (error: any) {
      console.error("Error deleting upcoming release:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete upcoming release",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const handleAddClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === "recent") {
      resetRecentForm();
    } else {
      resetUpcomingForm();
    }
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <Tabs defaultValue="recent" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="recent">Recent Releases</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Releases</TabsTrigger>
            </TabsList>
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleAddClick("recent")} 
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Add Recent
              </Button>
              <Button 
                onClick={() => handleAddClick("upcoming")} 
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Add Upcoming
              </Button>
            </div>
          </div>
          
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Recent Pokémon Set Releases</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingRecent ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : recentReleases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent releases found. Add your first recent release!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">Image</th>
                          <th className="p-3 text-left">Name</th>
                          <th className="p-3 text-left">Release Date</th>
                          <th className="p-3 text-center">Popularity</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentReleases.map(release => (
                          <tr key={release.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-200">
                                {release.image_url ? (
                                  <img 
                                    src={release.image_url} 
                                    alt={release.name} 
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/475569?text=TCG";
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                                    No image
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-medium">{release.name}</td>
                            <td className="p-3">{formatDate(release.release_date)}</td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center">
                                <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full" 
                                    style={{ width: `${release.popularity || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600 ml-2">{release.popularity || 0}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => editRecentRelease(release)}
                                >
                                  <PenSquare className="h-4 w-4" />
                                  <span className="sr-only md:not-sr-only md:inline-block">Edit</span>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      className="gap-1"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only md:not-sr-only md:inline-block">Delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the release "{release.name}".
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteRecentRelease(release.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Upcoming Pokémon Set Releases</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingUpcoming ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : upcomingReleases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No upcoming releases found. Add your first upcoming release!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">Image</th>
                          <th className="p-3 text-left">Name</th>
                          <th className="p-3 text-left">Release Date</th>
                          <th className="p-3 text-left">Type</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingReleases.map(release => (
                          <tr key={release.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-200">
                                {release.image_url ? (
                                  <img 
                                    src={release.image_url} 
                                    alt={release.name} 
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/475569?text=TCG";
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                                    No image
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-medium">{release.name}</td>
                            <td className="p-3">{formatDate(release.release_date)}</td>
                            <td className="p-3">{release.type || "Expansion"}</td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => editUpcomingRelease(release)}
                                >
                                  <PenSquare className="h-4 w-4" />
                                  <span className="sr-only md:not-sr-only md:inline-block">Edit</span>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      className="gap-1"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only md:not-sr-only md:inline-block">Delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the release "{release.name}".
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUpcomingRelease(release.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {activeTab === "recent" ? 
                  (recentFormData.id ? "Edit Recent Release" : "Add Recent Release") : 
                  (upcomingFormData.id ? "Edit Upcoming Release" : "Add Upcoming Release")
                }
              </DialogTitle>
            </DialogHeader>
            
            {activeTab === "recent" ? (
              <form onSubmit={handleRecentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Set Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Scarlet & Violet"
                    value={recentFormData.name}
                    onChange={handleRecentChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="release_date">Release Date</Label>
                  <div className="relative">
                    <Input
                      id="release_date"
                      name="release_date"
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={recentFormData.release_date}
                      onChange={handleRecentChange}
                      required
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="popularity">Popularity ({recentFormData.popularity}%)</Label>
                  <Input
                    id="popularity"
                    name="popularity"
                    type="range"
                    min="0"
                    max="100"
                    value={recentFormData.popularity}
                    onChange={handleRecentChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    placeholder="https://example.com/image.jpg"
                    value={recentFormData.image_url}
                    onChange={handleRecentChange}
                  />
                  {recentFormData.image_url && (
                    <div className="mt-2 h-24 w-24 rounded overflow-hidden border">
                      <img 
                        src={recentFormData.image_url} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/475569?text=TCG";
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingRecent}>
                    {isSubmittingRecent ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      recentFormData.id ? "Update Release" : "Add Release"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handleUpcomingSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Set Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Temporal Forces"
                    value={upcomingFormData.name}
                    onChange={handleUpcomingChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="release_date">Release Date</Label>
                  <div className="relative">
                    <Input
                      id="release_date"
                      name="release_date"
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={upcomingFormData.release_date}
                      onChange={handleUpcomingChange}
                      required
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Set Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={upcomingFormData.type}
                    onChange={handleUpcomingChange}
                  >
                    <option value="Expansion">Expansion</option>
                    <option value="Special Set">Special Set</option>
                    <option value="Promo">Promo</option>
                    <option value="Box Set">Box Set</option>
                    <option value="Elite Trainer Box">Elite Trainer Box</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    placeholder="https://example.com/image.jpg"
                    value={upcomingFormData.image_url}
                    onChange={handleUpcomingChange}
                  />
                  {upcomingFormData.image_url && (
                    <div className="mt-2 h-24 w-24 rounded overflow-hidden border">
                      <img 
                        src={upcomingFormData.image_url} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/100x100/e2e8f0/475569?text=TCG";
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingUpcoming}>
                    {isSubmittingUpcoming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      upcomingFormData.id ? "Update Release" : "Add Release"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ManagePokemonReleases;
