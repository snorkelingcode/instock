import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache } from '@/utils/cacheUtils';
import { fetchPokemonSets } from '@/utils/pokemon-cards';

interface UseTCGSetsOptions {
  cacheTime?: number; // Time in minutes to cache the data
  initialChunkSize?: number; // Initial number of sets to load
  additionalChunkSize?: number; // Number of sets to load when loadMore is called
}

export function usePokemonSets(options: UseTCGSetsOptions = {}) {
  const [sets, setSets] = useState<any[]>([]);
  const [allSets, setAllSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { 
    cacheTime = 30, 
    initialChunkSize = 24, 
    additionalChunkSize = 24 
  } = options;

  // Fetch all sets initially but only display a chunk
  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        
        // First try to get from our pokemon-cards utility which combines caching
        // and API fallback
        try {
          const pokemonSets = await fetchPokemonSets();
          if (pokemonSets && pokemonSets.length > 0) {
            setAllSets(pokemonSets);
            // Only show initial chunk
            setSets(pokemonSets.slice(0, initialChunkSize));
            setHasMore(pokemonSets.length > initialChunkSize);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Error using fetchPokemonSets:", err);
          // Continue to other methods if this fails
        }
        
        // Try to get data from cache next
        const cachedSets = getCache<any[]>('pokemon_sets');
        
        if (cachedSets && cachedSets.length > 0) {
          setAllSets(cachedSets);
          // Only show initial chunk
          setSets(cachedSets.slice(0, initialChunkSize));
          setHasMore(cachedSets.length > initialChunkSize);
          setLoading(false);
          return;
        }
        
        // If not in cache, fetch from database
        const { data, error } = await supabase
          .from('pokemon_sets')
          .select('*')
          .order('release_date', { ascending: false });
          
        if (error) throw error;
        
        // Store in cache for future use
        if (data && data.length > 0) {
          setCache('pokemon_sets', data, cacheTime);
          setAllSets(data);
          // Only show initial chunk
          setSets(data.slice(0, initialChunkSize));
          setHasMore(data.length > initialChunkSize);
        } else {
          // No data found
          setAllSets([]);
          setSets([]);
          setHasMore(false);
        }
      } catch (err: any) {
        console.error('Error fetching Pokemon sets:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [cacheTime, initialChunkSize]);

  // Function to load more sets
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const currentLength = sets.length;
    const nextChunk = allSets.slice(currentLength, currentLength + additionalChunkSize);
    
    setSets(prevSets => [...prevSets, ...nextChunk]);
    setHasMore(currentLength + additionalChunkSize < allSets.length);
    setLoadingMore(false);
  }, [sets.length, allSets, loadingMore, hasMore, additionalChunkSize]);

  return { sets, loading, loadingMore, error, hasMore, loadMore };
}

export function useMTGSets(options: UseTCGSetsOptions = {}) {
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { cacheTime = 30 } = options;

  useEffect(() => {
    const fetchSets = async () => {
      try {
        // Try to get data from cache first
        const cachedSets = getCache<any[]>('mtg_sets');
        
        if (cachedSets) {
          setSets(cachedSets);
          setLoading(false);
          return;
        }
        
        // If not in cache, fetch from database
        const { data, error } = await supabase
          .from('mtg_sets')
          .select('*')
          .order('release_date', { ascending: false });
          
        if (error) throw error;
        
        // Store in cache for future use
        if (data) {
          setCache('mtg_sets', data, cacheTime);
          setSets(data);
        }
      } catch (err: any) {
        console.error('Error fetching MTG sets:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [cacheTime]);

  return { sets, loading, error };
}

export function useYugiohSets(options: UseTCGSetsOptions = {}) {
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { cacheTime = 30 } = options;

  useEffect(() => {
    const fetchSets = async () => {
      try {
        // Try to get data from cache first
        const cachedSets = getCache<any[]>('yugioh_sets');
        
        if (cachedSets) {
          setSets(cachedSets);
          setLoading(false);
          return;
        }
        
        // If not in cache, fetch from database
        const { data, error } = await supabase
          .from('yugioh_sets')
          .select('*')
          .order('tcg_date', { ascending: false });
          
        if (error) throw error;
        
        // Store in cache for future use
        if (data) {
          setCache('yugioh_sets', data, cacheTime);
          setSets(data);
        }
      } catch (err: any) {
        console.error('Error fetching Yu-Gi-Oh! sets:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [cacheTime]);

  return { sets, loading, error };
}

export function useLorcanaSets(options: UseTCGSetsOptions = {}) {
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { cacheTime = 30 } = options;

  useEffect(() => {
    const fetchSets = async () => {
      try {
        // Try to get data from cache first
        const cachedSets = getCache<any[]>('lorcana_sets');
        
        if (cachedSets) {
          setSets(cachedSets);
          setLoading(false);
          return;
        }
        
        // If not in cache, fetch from database
        const { data, error } = await supabase
          .from('lorcana_sets')
          .select('*')
          .order('release_date', { ascending: false });
          
        if (error) throw error;
        
        // Store in cache for future use
        if (data) {
          setCache('lorcana_sets', data, cacheTime);
          setSets(data);
        }
      } catch (err: any) {
        console.error('Error fetching Lorcana sets:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [cacheTime]);

  return { sets, loading, error };
}
