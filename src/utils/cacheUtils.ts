
/**
 * Set data in local storage cache
 * @param key Cache key
 * @param data Data to cache
 * @param expirationMinutes Expiration time in minutes (defaults to 5)
 * @param partition Optional partition name to organize cache
 */
export function setCache<T>(
  key: string, 
  data: T, 
  expirationMinutes: number = 5, 
  partition?: string
): void {
  try {
    const cacheKey = partition ? `cache_${partition}_${key}` : `cache_${key}`;
    const cacheItem = {
      data,
      expiry: new Date().getTime() + expirationMinutes * 60 * 1000,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

/**
 * Get data from local storage cache
 * @param key Cache key
 * @param partition Optional partition name
 * @returns Cached data or null if expired/not found
 */
export function getCache<T>(key: string, partition?: string): T | null {
  try {
    const cacheKey = partition ? `cache_${partition}_${key}` : `cache_${key}`;
    const cacheJson = localStorage.getItem(cacheKey);
    if (!cacheJson) return null;

    const cache = JSON.parse(cacheJson);
    const now = new Date().getTime();

    if (now > cache.expiry) {
      // Cache expired
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cache.data as T;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

/**
 * Clear all cached items
 */
export function clearCache(): void {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Invalidate article cache by removing specific cached items
 */
export function invalidateArticlesCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_') && key.includes('articles')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error invalidating articles cache:', error);
  }
}

/**
 * Invalidate TCG cache by removing specific cached items
 */
export function invalidateTcgCache(game?: string): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_') && key.includes('tcg')) {
        if (!game || key.includes(game.toLowerCase())) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error invalidating TCG cache:', error);
  }
}

/**
 * Check if a rate limit is currently active
 */
export function isRateLimited(key: string): boolean {
  const rateLimitData = localStorage.getItem(`rateLimit_${key}`);
  if (!rateLimitData) return false;
  
  const rateLimit = JSON.parse(rateLimitData);
  const now = new Date().getTime();
  
  return now < rateLimit.expiry;
}

/**
 * Set a rate limit for a specific operation
 */
export function setRateLimit(key: string, durationMinutes: number): void {
  try {
    const rateLimit = {
      expiry: new Date().getTime() + durationMinutes * 60 * 1000,
    };
    localStorage.setItem(`rateLimit_${key}`, JSON.stringify(rateLimit));
  } catch (error) {
    console.error('Error setting rate limit:', error);
  }
}

/**
 * Get the remaining time for a rate limit in milliseconds
 */
export function getRateLimitTimeRemaining(key: string): number {
  try {
    const rateLimitData = localStorage.getItem(`rateLimit_${key}`);
    if (!rateLimitData) return 0;
    
    const rateLimit = JSON.parse(rateLimitData);
    const now = new Date().getTime();
    
    return Math.max(0, rateLimit.expiry - now);
  } catch (error) {
    console.error('Error getting rate limit time remaining:', error);
    return 0;
  }
}

/**
 * Synchronize server-side rate limit with client-side
 */
export function syncServerRateLimit(key: string, result: any, durationMinutes: number): boolean {
  // If the server indicates rate limiting, set a client-side rate limit
  if (result?.error?.message?.includes('rate limit') || 
      result?.message?.includes('rate limit')) {
    setRateLimit(key, durationMinutes);
    return true;
  }
  return false;
}

/**
 * Format time remaining in a human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '0 seconds';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get cache partition information including total size
 */
export function getPartitionInfo(prefix: string = ''): { count: number, size: number, lastUpdated: number } {
  try {
    let totalSize = 0;
    let count = 0;
    let lastUpdated = 0;
    
    Object.keys(localStorage).forEach(key => {
      if ((prefix && key.startsWith(`cache_${prefix}`)) || (!prefix && key.startsWith('cache_'))) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length * 2; // Approximate size in bytes (2 bytes per character)
          count++;
          
          // Try to get the timestamp from the cache object
          try {
            const cacheData = JSON.parse(item);
            const timestamp = cacheData.expiry - (5 * 60 * 1000); // Estimate of when it was added
            if (timestamp > lastUpdated) {
              lastUpdated = timestamp;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    });
    
    return { count, size: totalSize, lastUpdated: lastUpdated || Date.now() };
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return { count: 0, size: 0, lastUpdated: Date.now() };
  }
}

/**
 * Get the total size of all cached items
 */
export function getTotalCacheSize(): number {
  return getPartitionInfo().size;
}
