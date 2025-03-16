
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Plus, PenSquare, Trash2, ArrowLeft } from "lucide-react";
import { useRecentPokemonReleases } from "@/hooks/usePokemonReleases";
import RecentReleaseEditor from "@/components/admin/RecentReleaseEditor";
import { RecentPokemonRelease } from "@/types/pokemon-releases";

const ManageRecentReleases = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<RecentPokemonRelease | undefined>(undefined);
  const { releases, loading, deleteRecentRelease, fetchRecentReleases } = useRecentPokemonReleases();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  useMetaTags({
    title: "Manage Recent Releases | Admin Dashboard",
    description: "Manage recent Pokémon TCG releases"
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

  const handleEditRelease = (release: RecentPokemonRelease) => {
    setSelectedRelease(release);
    setIsEditorOpen(true);
  };

  const handleEditorSubmit = () => {
    setIsEditorOpen(false);
    fetchRecentReleases();
  };

  const handleEditorCancel = () => {
    setIsEditorOpen(false);
  };

  const handleDeleteRelease = async (id: string) => {
    if (!confirm("Are you sure you want to delete this release?")) {
      return;
    }
    
    try {
      await deleteRecentRelease(id);
      
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
          <RecentReleaseEditor
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
            <CardTitle>Manage Recent Pokémon Releases</CardTitle>
            <Button onClick={handleCreateRelease} className="gap-2">
              <Plus className="h-4 w-4" /> Add Recent Release
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">Loading releases...</div>
            ) : releases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent releases found. Create your first release!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Release Date</th>
                      <th className="p-3 text-center">Popularity</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releases.map(release => (
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
                        <td className="p-3">{formatDate(release.release_date)}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full" 
                                style={{ width: `${release.popularity}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 ml-2">{release.popularity}%</span>
                          </div>
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
                    ))}
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

export default ManageRecentReleases;
