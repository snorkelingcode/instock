
/**
 * Set data in local storage cache
 * @param key Cache key
 * @param data Data to cache
 * @param expirationMinutes Expiration time in minutes (defaults to 5)
 */
export function setCache(key: string, data: any, expirationMinutes: number = 5): void {
  try {
    const cacheItem = {
      data,
      expiry: new Date().getTime() + expirationMinutes * 60 * 1000,
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

/**
 * Get data from local storage cache
 * @param key Cache key
 * @returns Cached data or null if expired/not found
 */
export function getCache<T>(key: string): T | null {
  try {
    const cacheJson = localStorage.getItem(`cache_${key}`);
    if (!cacheJson) return null;

    const cache = JSON.parse(cacheJson);
    const now = new Date().getTime();

    if (now > cache.expiry) {
      // Cache expired
      localStorage.removeItem(`cache_${key}`);
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
