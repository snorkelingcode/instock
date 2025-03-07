
// Utility functions for managing cache in localStorage
// with TTL (Time To Live) support

interface CacheItem<T> {
  data: T;
  expiry: number; // Unix timestamp when this cache expires
}

/**
 * Store data in cache with expiration
 * @param key The cache key
 * @param data The data to cache
 * @param ttlMinutes Time to live in minutes
 */
export const setCache = <T>(key: string, data: T, ttlMinutes: number = 60): void => {
  try {
    const now = new Date();
    const item: CacheItem<T> = {
      data,
      expiry: now.getTime() + ttlMinutes * 60 * 1000,
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    console.log(`Cached data for key: ${key}, expires in ${ttlMinutes} minutes`);
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};

/**
 * Get data from cache if it exists and is not expired
 * @param key The cache key
 * @returns The cached data or null if not found or expired
 */
export const getCache = <T>(key: string): T | null => {
  try {
    const itemStr = localStorage.getItem(`cache_${key}`);
    if (!itemStr) {
      return null;
    }

    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = new Date();
    
    // Check if the item is expired
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(`cache_${key}`);
      console.log(`Cache expired for key: ${key}`);
      return null;
    }
    
    console.log(`Retrieved data from cache for key: ${key}`);
    return item.data;
  } catch (error) {
    console.error("Error getting cache:", error);
    return null;
  }
};

/**
 * Clear a specific cache item
 * @param key The cache key to clear
 */
export const clearCache = (key: string): void => {
  localStorage.removeItem(`cache_${key}`);
  console.log(`Cleared cache for key: ${key}`);
};

/**
 * Clear all cache items with a specific prefix
 * @param prefix The prefix for cache keys to clear
 */
export const clearCacheByPrefix = (prefix: string): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`cache_${prefix}`)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`Cleared ${keysToRemove.length} cache items with prefix: ${prefix}`);
};

/**
 * Invalidate all cache items related to a specific TCG
 * @param tcgName Name of the TCG (pokemon, mtg, yugioh, lorcana)
 */
export const invalidateTcgCache = (tcgName: string): void => {
  clearCacheByPrefix(tcgName);
};
