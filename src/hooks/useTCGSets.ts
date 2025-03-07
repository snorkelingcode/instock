
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache } from '@/utils/cacheUtils';

interface UseTCGSetsOptions {
  cacheTime?: number; // Time in minutes to cache the data
}

export function usePokemonSets(options: UseTCGSetsOptions = {}) {
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { cacheTime = 30 } = options;

  useEffect(() => {
    const fetchSets = async () => {
      try {
        // Try to get data from cache first
        const cachedSets = getCache<any[]>('pokemon_sets');
        
        if (cachedSets) {
          setSets(cachedSets);
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
        if (data) {
          setCache('pokemon_sets', data, cacheTime);
          setSets(data);
        }
      } catch (err: any) {
        console.error('Error fetching Pokemon sets:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [cacheTime]);

  return { sets, loading, error };
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
