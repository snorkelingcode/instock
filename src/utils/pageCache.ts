
import { setCache, getCache } from './cacheUtils';

/**
 * Cache key prefix for page content
 */
const PAGE_CACHE_PREFIX = 'page_cache';

/**
 * Default expiration time for cached pages in minutes
 */
const DEFAULT_CACHE_EXPIRATION = 15;

/**
 * Save page content to cache
 * @param path The URL path of the page
 * @param content The content or data to cache
 * @param expirationMinutes How long to cache the content (default: 15 minutes)
 */
export function cachePageContent<T>(
  path: string,
  content: T,
  expirationMinutes: number = DEFAULT_CACHE_EXPIRATION
): void {
  const cacheKey = normalizePath(path);
  setCache(cacheKey, content, expirationMinutes, PAGE_CACHE_PREFIX);
}

/**
 * Get cached page content if available
 * @param path The URL path of the page
 * @returns Cached content or null if not found/expired
 */
export function getCachedPageContent<T>(path: string): T | null {
  const cacheKey = normalizePath(path);
  return getCache<T>(cacheKey, PAGE_CACHE_PREFIX);
}

/**
 * Check if a page is cached
 * @param path The URL path to check
 * @returns True if the page has valid cache
 */
export function isPageCached(path: string): boolean {
  const cacheKey = normalizePath(path);
  return getCache(cacheKey, PAGE_CACHE_PREFIX) !== null;
}

/**
 * Clear cache for a specific page
 * @param path The URL path to clear
 */
export function clearPageCache(path: string): void {
  try {
    const cacheKey = normalizePath(path);
    localStorage.removeItem(`cache_${PAGE_CACHE_PREFIX}_${cacheKey}`);
  } catch (error) {
    console.error('Error clearing page cache:', error);
  }
}

/**
 * Clear all cached pages
 */
export function clearAllPageCache(): void {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`cache_${PAGE_CACHE_PREFIX}_`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all page cache:', error);
  }
}

/**
 * Normalize path for consistent cache keys
 * @param path The path to normalize
 * @returns Normalized path
 */
function normalizePath(path: string): string {
  // Remove leading slash, trailing slash, and query parameters
  return path.replace(/^\/+|\/+$|\?.*$/g, '');
}
