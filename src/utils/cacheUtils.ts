
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

/**
 * Get the time remaining for a rate-limited operation
 * @param key The operation key
 * @returns Time remaining in seconds, or 0 if not rate-limited
 */
export const getRateLimitTimeRemaining = (key: string): number => {
  try {
    const rateLimitKey = `ratelimit_${key}`;
    const limitData = localStorage.getItem(rateLimitKey);
    
    if (!limitData) {
      return 0;
    }
    
    const expiryTime = parseInt(limitData, 10);
    const now = new Date().getTime();
    
    return expiryTime > now ? Math.ceil((expiryTime - now) / 1000) : 0;
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return 0;
  }
};

/**
 * Set a rate limit for an operation
 * @param key The operation key
 * @param durationSeconds Duration of the rate limit in seconds
 * @returns The expiry timestamp
 */
export const setRateLimit = (key: string, durationSeconds: number): number => {
  const rateLimitKey = `ratelimit_${key}`;
  const now = new Date().getTime();
  const expiryTime = now + (durationSeconds * 1000);
  
  localStorage.setItem(rateLimitKey, expiryTime.toString());
  console.log(`Rate limit set for ${key}, expires in ${durationSeconds} seconds`);
  
  return expiryTime;
};

/**
 * Check if an operation is rate-limited
 * @param key The operation key
 * @returns True if rate-limited, false otherwise
 */
export const isRateLimited = (key: string): boolean => {
  return getRateLimitTimeRemaining(key) > 0;
};

/**
 * Clear a rate limit
 * @param key The operation key
 */
export const clearRateLimit = (key: string): void => {
  localStorage.removeItem(`ratelimit_${key}`);
  console.log(`Cleared rate limit for ${key}`);
};

/**
 * Convert a server-side rate limit response to a client-side rate limit
 * @param key The operation key 
 * @param retryAfterSeconds Retry-After time in seconds from server
 */
export const syncServerRateLimit = (key: string, retryAfterSeconds: number): void => {
  if (retryAfterSeconds > 0) {
    setRateLimit(key, retryAfterSeconds);
    console.log(`Synced server rate limit for ${key}: ${retryAfterSeconds}s`);
  }
};

/**
 * Format a duration in seconds to a human-readable string (MM:SS)
 * @param seconds Duration in seconds
 * @returns Formatted string in MM:SS format
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
