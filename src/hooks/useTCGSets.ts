import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache } from '@/utils/cacheUtils';
import { fetchPokemonSets } from '@/utils/pokemon-cards';

interface UseTCGSetsOptions {
  cacheTime?: number; // Time in minutes to cache the data
  prioritizeRecent?: boolean; // Whether to prioritize recent sets (default: true)
}

export function usePokemonSets(options: UseTCGSetsOptions = {}) {
  const [allSets, setAllSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { 
    cacheTime = 30,
    prioritizeRecent = true 
  } = options;

  // Fetch all sets at once
  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        console.log("Fetching all Pokemon sets");
        
        // First try to get from our pokemon-cards utility which combines caching
        // and API fallback
        try {
          const pokemonSets = await fetchPokemonSets();
          if (pokemonSets && pokemonSets.length > 0) {
            console.log(`Received ${pokemonSets.length} Pokemon sets`);
            
            // Sort sets by release date if prioritizing recent
            let sortedSets = [...pokemonSets];
            if (prioritizeRecent) {
              sortedSets = sortedSets.sort((a, b) => {
                // Handle missing release dates
                if (!a.release_date) return 1;
                if (!b.release_date) return -1;
                return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
              });
            }
            
            setAllSets(sortedSets);
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
          console.log(`Using ${cachedSets.length} cached Pokemon sets`);
          
          // Sort sets by release date if prioritizing recent
          let sortedSets = [...cachedSets];
          if (prioritizeRecent) {
            sortedSets = sortedSets.sort((a, b) => {
              // Handle missing release dates
              if (!a.release_date) return 1;
              if (!b.release_date) return -1;
              return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
            });
          }
          
          setAllSets(sortedSets);
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
          console.log(`Fetched ${data.length} Pokemon sets from database`);
          setCache('pokemon_sets', data, cacheTime);
          setAllSets(data);
        } else {
          // No data found
          console.log("No Pokemon sets found in database");
          setAllSets([]);
        }
      } catch (err: any) {
        console.error('Error fetching Pokemon sets:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [cacheTime, prioritizeRecent]);

  return { 
    sets: allSets, 
    loading, 
    error, 
    totalSetsCount: allSets.length
  };
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
