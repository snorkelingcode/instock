
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RecentPokemonRelease, UpcomingPokemonRelease } from '@/types/pokemon-releases';

export function useRecentPokemonReleases() {
  const [releases, setReleases] = useState<RecentPokemonRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchRecentReleases();
  }, []);

  const fetchRecentReleases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pokemon_recent_releases')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) throw error;
      setReleases(data as RecentPokemonRelease[]);
    } catch (err: any) {
      console.error('Error fetching recent Pokemon releases:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const addRecentRelease = async (release: Omit<RecentPokemonRelease, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pokemon_recent_releases')
        .insert([release])
        .select()
        .single();

      if (error) throw error;
      setReleases(prev => [data as RecentPokemonRelease, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding recent Pokemon release:', err);
      toast.error(err.message || 'Failed to add release');
      throw err;
    }
  };

  const updateRecentRelease = async (id: string, updates: Partial<Omit<RecentPokemonRelease, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('pokemon_recent_releases')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setReleases(prev => 
        prev.map(release => 
          release.id === id ? (data as RecentPokemonRelease) : release
        )
      );
      return data;
    } catch (err: any) {
      console.error('Error updating recent Pokemon release:', err);
      toast.error(err.message || 'Failed to update release');
      throw err;
    }
  };

  const deleteRecentRelease = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pokemon_recent_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReleases(prev => prev.filter(release => release.id !== id));
    } catch (err: any) {
      console.error('Error deleting recent Pokemon release:', err);
      toast.error(err.message || 'Failed to delete release');
      throw err;
    }
  };

  return { 
    releases, 
    loading, 
    error, 
    fetchRecentReleases, 
    addRecentRelease, 
    updateRecentRelease, 
    deleteRecentRelease 
  };
}

export function useUpcomingPokemonReleases() {
  const [releases, setReleases] = useState<UpcomingPokemonRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUpcomingReleases();
  }, []);

  const fetchUpcomingReleases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pokemon_upcoming_releases')
        .select('*')
        .order('release_date', { ascending: true });

      if (error) throw error;
      setReleases(data as UpcomingPokemonRelease[]);
    } catch (err: any) {
      console.error('Error fetching upcoming Pokemon releases:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const addUpcomingRelease = async (release: Omit<UpcomingPokemonRelease, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pokemon_upcoming_releases')
        .insert([release])
        .select()
        .single();

      if (error) throw error;
      setReleases(prev => [...prev, data as UpcomingPokemonRelease]);
      return data;
    } catch (err: any) {
      console.error('Error adding upcoming Pokemon release:', err);
      toast.error(err.message || 'Failed to add release');
      throw err;
    }
  };

  const updateUpcomingRelease = async (id: string, updates: Partial<Omit<UpcomingPokemonRelease, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('pokemon_upcoming_releases')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setReleases(prev => 
        prev.map(release => 
          release.id === id ? (data as UpcomingPokemonRelease) : release
        )
      );
      return data;
    } catch (err: any) {
      console.error('Error updating upcoming Pokemon release:', err);
      toast.error(err.message || 'Failed to update release');
      throw err;
    }
  };

  const deleteUpcomingRelease = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pokemon_upcoming_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReleases(prev => prev.filter(release => release.id !== id));
    } catch (err: any) {
      console.error('Error deleting upcoming Pokemon release:', err);
      toast.error(err.message || 'Failed to delete release');
      throw err;
    }
  };

  return { 
    releases, 
    loading, 
    error, 
    fetchUpcomingReleases, 
    addUpcomingRelease, 
    updateUpcomingRelease, 
    deleteUpcomingRelease 
  };
}

export function useImageUpload() {
  const uploadImage = async (file: File, path: string = ''): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;
      
      const { error: uploadError, data } = await supabase.storage
        .from('pokemon-release-images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('pokemon-release-images')
        .getPublicUrl(filePath);
        
      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
      throw error;
    }
  };

  return { uploadImage };
}
