
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Plus, PenSquare, Trash2, ArrowLeft, CalendarIcon } from "lucide-react";
import { useUpcomingPokemonReleases } from "@/hooks/usePokemonReleases";
import UpcomingReleaseEditor from "@/components/admin/UpcomingReleaseEditor";
import { UpcomingPokemonRelease } from "@/types/pokemon-releases";

const ManageUpcomingReleases = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<UpcomingPokemonRelease | undefined>(undefined);
  const { releases, loading, deleteUpcomingRelease, fetchUpcomingReleases } = useUpcomingPokemonReleases();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  useMetaTags({
    title: "Manage Upcoming Releases | Admin Dashboard",
    description: "Manage upcoming Pokémon TCG releases"
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
  }, [isAdmin]);

  const handleCreateRelease = () => {
    setSelectedRelease(undefined);
    setIsEditorOpen(true);
  };

  const handleEditRelease = (release: UpcomingPokemonRelease) => {
    setSelectedRelease(release);
    setIsEditorOpen(true);
  };

  const handleEditorSubmit = () => {
    setIsEditorOpen(false);
    fetchUpcomingReleases();
  };

  const handleEditorCancel = () => {
    setIsEditorOpen(false);
  };

  const handleDeleteRelease = async (id: string) => {
    if (!confirm("Are you sure you want to delete this release?")) {
      return;
    }
    
    try {
      await deleteUpcomingRelease(id);
      
      toast({
        title: "Release Deleted",
        description: "The release has been successfully deleted",
      });
    } catch (error: any) {
      console.error("Error deleting release:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  function calculateDaysUntil(dateString: string): number {
    const releaseDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = releaseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function getBadgeColor(days: number): string {
    if (days < 0) return "bg-gray-400"; // Past
    if (days < 7) return "bg-red-500";  // Very soon
    if (days < 30) return "bg-yellow-500"; // Soon
    return "bg-green-500";  // Far away
  }

  if (isEditorOpen) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Button 
            variant="outline" 
            onClick={handleEditorCancel}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Releases
          </Button>
          <UpcomingReleaseEditor
            release={selectedRelease}
            onSubmit={handleEditorSubmit}
            onCancel={handleEditorCancel}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/articles")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
            <CardTitle>Manage Upcoming Pokémon Releases</CardTitle>
            <Button onClick={handleCreateRelease} className="gap-2">
              <Plus className="h-4 w-4" /> Add Upcoming Release
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">Loading releases...</div>
            ) : releases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming releases found. Create your first release!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Release Date</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releases.map(release => {
                      const daysUntil = calculateDaysUntil(release.release_date);
                      return (
                        <tr key={release.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              {release.image_url && (
                                <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                                  <img 
                                    src={release.image_url} 
                                    alt={release.name} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <span className="font-medium">{release.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                              {formatDate(release.release_date)}
                            </div>
                          </td>
                          <td className="p-3">{release.type}</td>
                          <td className="p-3 text-center">
                            <Badge 
                              className={getBadgeColor(daysUntil)}
                            >
                              {daysUntil < 0 
                                ? 'Released' 
                                : daysUntil === 0 
                                  ? 'Today!' 
                                  : `${daysUntil} day${daysUntil === 1 ? '' : 's'}`}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleEditRelease(release)}
                              >
                                <PenSquare className="h-4 w-4" />
                                <span className="sr-only md:not-sr-only md:inline-block">Edit</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="gap-1"
                                onClick={() => handleDeleteRelease(release.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only md:not-sr-only md:inline-block">Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManageUpcomingReleases;
