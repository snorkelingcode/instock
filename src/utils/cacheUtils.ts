
// Utility functions for managing cache in localStorage
// with TTL (Time To Live) support and data partitioning

interface CacheItem<T> {
  data: T;
  expiry: number; // Unix timestamp when this cache expires
  partition?: string; // Optional partition identifier
}

interface PartitionInfo {
  name: string;
  size: number;
  lastUpdated: number;
}

/**
 * Store data in cache with expiration
 * @param key The cache key
 * @param data The data to cache
 * @param ttlMinutes Time to live in minutes
 * @param partition Optional partition identifier
 */
export const setCache = <T>(key: string, data: T, ttlMinutes: number = 60, partition?: string): void => {
  try {
    const now = new Date();
    const item: CacheItem<T> = {
      data,
      expiry: now.getTime() + ttlMinutes * 60 * 1000,
      partition
    };
    
    const cacheKey = partition ? `cache_${partition}_${key}` : `cache_${key}`;
    localStorage.setItem(cacheKey, JSON.stringify(item));
    
    // Update partition metadata if we're using partitions
    if (partition) {
      updatePartitionMetadata(partition, JSON.stringify(item).length);
    }
    
    console.log(`Cached data for key: ${key}${partition ? ` in partition ${partition}` : ''}, expires in ${ttlMinutes} minutes`);
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};

/**
 * Get data from cache if it exists and is not expired
 * @param key The cache key
 * @param partition Optional partition identifier
 * @returns The cached data or null if not found or expired
 */
export const getCache = <T>(key: string, partition?: string): T | null => {
  try {
    const cacheKey = partition ? `cache_${partition}_${key}` : `cache_${key}`;
    const itemStr = localStorage.getItem(cacheKey);
    
    if (!itemStr) {
      return null;
    }

    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = new Date();
    
    // Check if the item is expired
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(cacheKey);
      
      // Update partition metadata if we're using partitions
      if (partition) {
        updatePartitionMetadata(partition, -JSON.stringify(item).length);
      }
      
      console.log(`Cache expired for key: ${key}${partition ? ` in partition ${partition}` : ''}`);
      return null;
    }
    
    console.log(`Retrieved data from cache for key: ${key}${partition ? ` from partition ${partition}` : ''}`);
    return item.data;
  } catch (error) {
    console.error("Error getting cache:", error);
    return null;
  }
};

/**
 * Clear a specific cache item
 * @param key The cache key
 * @param partition Optional partition identifier
 */
export const clearCache = (key: string, partition?: string): void => {
  const cacheKey = partition ? `cache_${partition}_${key}` : `cache_${key}`;
  
  // Get the size of the item before removing it (for partition metadata update)
  if (partition) {
    try {
      const itemStr = localStorage.getItem(cacheKey);
      if (itemStr) {
        const size = itemStr.length;
        localStorage.removeItem(cacheKey);
        updatePartitionMetadata(partition, -size);
      }
    } catch (error) {
      console.error("Error clearing cache with partition metadata update:", error);
      localStorage.removeItem(cacheKey);
    }
  } else {
    localStorage.removeItem(cacheKey);
  }
  
  console.log(`Cleared cache for key: ${key}${partition ? ` in partition ${partition}` : ''}`);
};

/**
 * Clear all cache items with a specific prefix
 * @param prefix The prefix for cache keys to clear
 * @param partition Optional partition identifier
 */
export const clearCacheByPrefix = (prefix: string, partition?: string): void => {
  const keysToRemove: string[] = [];
  const prefixToMatch = partition ? `cache_${partition}_${prefix}` : `cache_${prefix}`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefixToMatch)) {
      keysToRemove.push(key);
    }
  }
  
  // If we're clearing a partition, track the total size to update metadata
  let totalSizeRemoved = 0;
  if (partition) {
    try {
      for (const key of keysToRemove) {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          totalSizeRemoved += itemStr.length;
        }
        localStorage.removeItem(key);
      }
      
      if (totalSizeRemoved > 0) {
        updatePartitionMetadata(partition, -totalSizeRemoved);
      }
    } catch (error) {
      console.error("Error clearing cache by prefix with partition metadata update:", error);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } else {
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
  
  console.log(`Cleared ${keysToRemove.length} cache items with prefix: ${prefix}${partition ? ` in partition ${partition}` : ''}`);
};

/**
 * Invalidate all cache items related to a specific TCG
 * @param tcgName Name of the TCG (pokemon, mtg, yugioh, lorcana)
 */
export const invalidateTcgCache = (tcgName: string): void => {
  clearCacheByPrefix(tcgName, "tcg");
};

/**
 * Update the metadata for a specific partition
 * @param partition The partition name
 * @param sizeDelta The change in size (positive for additions, negative for removals)
 */
const updatePartitionMetadata = (partition: string, sizeDelta: number): void => {
  try {
    const metadataKey = `partition_metadata_${partition}`;
    const now = new Date().getTime();
    let metadata: PartitionInfo;
    
    const existingMetadata = localStorage.getItem(metadataKey);
    if (existingMetadata) {
      metadata = JSON.parse(existingMetadata);
      metadata.size += sizeDelta;
      metadata.lastUpdated = now;
    } else {
      metadata = {
        name: partition,
        size: Math.max(0, sizeDelta), // Ensure size is never negative on first creation
        lastUpdated: now
      };
    }
    
    localStorage.setItem(metadataKey, JSON.stringify(metadata));
  } catch (error) {
    console.error("Error updating partition metadata:", error);
  }
};

/**
 * Get metadata for all partitions
 * @returns Array of partition information objects
 */
export const getAllPartitions = (): PartitionInfo[] => {
  try {
    const partitions: PartitionInfo[] = [];
    const metadataPrefix = 'partition_metadata_';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(metadataPrefix)) {
        const partitionMetadata = localStorage.getItem(key);
        if (partitionMetadata) {
          partitions.push(JSON.parse(partitionMetadata));
        }
      }
    }
    
    return partitions;
  } catch (error) {
    console.error("Error getting partition metadata:", error);
    return [];
  }
};

/**
 * Get information about a specific partition
 * @param partition The partition name
 * @returns Partition information or null if not found
 */
export const getPartitionInfo = (partition: string): PartitionInfo | null => {
  try {
    const metadataKey = `partition_metadata_${partition}`;
    const metadata = localStorage.getItem(metadataKey);
    
    if (metadata) {
      return JSON.parse(metadata);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting partition info:", error);
    return null;
  }
};

/**
 * Clear an entire partition and its metadata
 * @param partition The partition name
 */
export const clearPartition = (partition: string): void => {
  try {
    // First clear all items in the partition
    clearCacheByPrefix('', partition);
    
    // Then remove the metadata
    localStorage.removeItem(`partition_metadata_${partition}`);
    
    console.log(`Cleared entire partition: ${partition}`);
  } catch (error) {
    console.error("Error clearing partition:", error);
  }
};

/**
 * Get the total size of all cached data across all partitions
 * @returns Total size in bytes
 */
export const getTotalCacheSize = (): number => {
  try {
    const partitions = getAllPartitions();
    return partitions.reduce((total, partition) => total + partition.size, 0);
  } catch (error) {
    console.error("Error getting total cache size:", error);
    return 0;
  }
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
