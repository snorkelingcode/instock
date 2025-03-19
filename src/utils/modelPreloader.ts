
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeDModel } from '@/types/model';

// Global cache for preloaded geometries
const preloadedGeometries = new Map<string, THREE.BufferGeometry>();
// Track ongoing load operations to prevent duplicate loads
const loadingPromises = new Map<string, Promise<THREE.BufferGeometry>>();
// Track model load states to prevent infinite loops
const modelLoadStates = new Map<string, 'loading' | 'loaded' | 'error'>();
// Flag to indicate if we're in a batch loading operation
let isBatchLoading = false;
// Track failed URLs to prevent repeated attempts
const failedUrls = new Set<string>();
// Track models that need cleanup (deleted from storage but still in DB)
const modelsNeedingCleanup = new Set<string>();
// All model combinations that have been preloaded
const preloadedCombinations = new Set<string>();

/**
 * Use browser storage to persist preload cache across page loads
 */
const saveCacheToStorage = () => {
  try {
    const cacheData = {
      failedUrls: Array.from(failedUrls),
      loadStates: Object.fromEntries(modelLoadStates.entries()),
      timestamp: Date.now()
    };
    localStorage.setItem('modelPreloaderCache', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to save cache to storage:', error);
  }
};

/**
 * Restore cache from browser storage
 */
const restoreCacheFromStorage = () => {
  try {
    const cacheData = localStorage.getItem('modelPreloaderCache');
    if (cacheData) {
      const parsedCache = JSON.parse(cacheData);
      
      // Only use cache if it's less than 1 hour old
      if (Date.now() - parsedCache.timestamp < 60 * 60 * 1000) {
        // Restore failed URLs
        if (parsedCache.failedUrls) {
          parsedCache.failedUrls.forEach((url: string) => failedUrls.add(url));
        }
        
        // Restore load states
        if (parsedCache.loadStates) {
          Object.entries(parsedCache.loadStates).forEach(([url, state]) => {
            modelLoadStates.set(url, state as 'loading' | 'loaded' | 'error');
          });
        }
        
        console.log('Restored model preloader cache from storage');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to restore cache from storage:', error);
    return false;
  }
};

// Initialize by restoring cache
restoreCacheFromStorage();

/**
 * Preload a 3D model geometry
 * @param url The URL of the STL file to preload
 * @returns A promise that resolves when the model is loaded
 */
export const preloadModelGeometry = async (url: string): Promise<THREE.BufferGeometry> => {
  // Skip invalid URLs
  if (!url || url.trim() === '') {
    console.error('Invalid URL provided to preloadModelGeometry');
    return Promise.reject(new Error('Invalid URL'));
  }
  
  // Check if URL previously failed with a 400/404 error
  if (failedUrls.has(url)) {
    console.warn(`Skipping previously failed URL: ${url}`);
    return Promise.reject(new Error(`URL previously failed: ${url}`));
  }
  
  // Return from cache if already loaded
  if (preloadedGeometries.has(url)) {
    const cachedGeometry = preloadedGeometries.get(url);
    if (cachedGeometry) {
      console.log(`Using cached geometry for ${url}`);
      return cachedGeometry.clone();
    }
  }
  
  // If this URL is already being loaded, return that promise instead of starting a new load
  if (loadingPromises.has(url)) {
    console.log(`Already loading ${url}, waiting for existing promise`);
    return loadingPromises.get(url) as Promise<THREE.BufferGeometry>;
  }
  
  // Set the model state to loading
  modelLoadStates.set(url, 'loading');
  
  // Create a new load promise
  const loadPromise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
    // Safety check: if model is already loaded but somehow we got here, use the cache
    if (modelLoadStates.get(url) === 'loaded' && preloadedGeometries.has(url)) {
      console.warn(`Model ${url} is marked as loaded but we're trying to load it again`);
      const cachedGeometry = preloadedGeometries.get(url);
      if (cachedGeometry) {
        modelLoadStates.set(url, 'loaded');
        resolve(cachedGeometry.clone());
        return;
      }
    }
    
    const loader = new STLLoader();
    
    loader.load(
      url,
      (geometry) => {
        try {
          // Clean up geometry
          geometry.center();
          if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
          }
          
          // Store in cache
          preloadedGeometries.set(url, geometry.clone());
          
          // Update state
          modelLoadStates.set(url, 'loaded');
          
          // Update storage cache
          saveCacheToStorage();
          
          // Remove from loading promises once done
          loadingPromises.delete(url);
          
          // Return the geometry
          resolve(geometry);
        } catch (error) {
          console.error(`Error processing geometry for ${url}:`, error);
          modelLoadStates.set(url, 'error');
          failedUrls.add(url);
          loadingPromises.delete(url);
          saveCacheToStorage();
          reject(error);
        }
      },
      (xhr) => {
        const progressPercent = Math.round(xhr.loaded / xhr.total * 100);
        console.log(`${progressPercent}% loaded for ${url}`);
      },
      (error) => {
        console.error('Error preloading model:', error);
        // Mark as error in state
        modelLoadStates.set(url, 'error');
        // Add to failed URLs to prevent future attempts
        failedUrls.add(url);
        // Add to models needing cleanup if it's a 400/404 error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage && (errorMessage.includes('400') || errorMessage.includes('404'))) {
          modelsNeedingCleanup.add(url);
        }
        // Update storage cache
        saveCacheToStorage();
        // Remove from loading promises on error
        loadingPromises.delete(url);
        reject(error);
      }
    );
  });
  
  // Add error handling wrapper around the load promise
  const safeLoadPromise = loadPromise.catch(error => {
    console.error(`Failed to load model ${url}:`, error);
    modelLoadStates.set(url, 'error');
    failedUrls.add(url);
    loadingPromises.delete(url);
    saveCacheToStorage();
    // Add to models needing cleanup if it's a 400/404 error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage && (errorMessage.includes('400') || errorMessage.includes('404'))) {
      modelsNeedingCleanup.add(url);
    }
    throw error; // Re-throw to propagate to caller
  });
  
  // Store the promise so we don't start duplicate loads
  loadingPromises.set(url, safeLoadPromise);
  
  return safeLoadPromise;
};

/**
 * Validate a model URL before attempting to load it
 * @param url The URL to validate
 * @returns True if the URL is valid and hasn't failed before
 */
const isValidModelUrl = (url: string): boolean => {
  if (!url || url.trim() === '') {
    console.warn('Empty or invalid URL skipped');
    return false;
  }
  
  if (failedUrls.has(url)) {
    console.warn(`Skipping previously failed URL: ${url}`);
    return false;
  }
  
  return true;
};

/**
 * Preload a batch of 3D models
 * @param models Array of models to preload
 * @param onProgress Callback for progress updates
 * @returns A promise that resolves when all models are loaded
 */
export const preloadModels = async (
  models: ThreeDModel[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> => {
  // Set batch loading flag
  isBatchLoading = true;
  
  // Filter out models that have previously failed
  const validModels = models.filter(model => {
    if (!model.stl_file_path || !isValidModelUrl(model.stl_file_path)) {
      return false;
    }
    
    if (didModelFail(model.stl_file_path)) {
      console.warn(`Skipping previously failed model: ${model.id} (${model.stl_file_path})`);
      return false;
    }
    
    return true;
  });
  
  const stlUrls = validModels.map(model => model.stl_file_path);
  
  const total = stlUrls.length;
  let loaded = 0;
  let errors = 0;
  
  console.log(`Starting batch load of ${total} valid models`);
  
  // Use Promise.allSettled to continue even if some models fail
  const loadPromises = stlUrls.map(async (url) => {
    try {
      // Skip if we've already loaded or are loading this model
      if (modelLoadStates.get(url) === 'loaded' && preloadedGeometries.has(url)) {
        loaded++;
        if (onProgress) {
          onProgress(loaded, total);
        }
        return;
      }
      
      // Skip if previously failed
      if (modelLoadStates.get(url) === 'error' || failedUrls.has(url)) {
        errors++;
        if (onProgress) {
          onProgress(loaded, total);
        }
        return;
      }
      
      await preloadModelGeometry(url);
      loaded++;
      if (onProgress) {
        onProgress(loaded, total);
      }
    } catch (error) {
      errors++;
      
      // Safely extract error message to prevent TypeScript errors
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      
      console.error(`Failed to preload model ${url}:`, errorMessage);
      
      // Check if it's a 400/404 error to mark for cleanup
      if (errorMessage && (errorMessage.includes('400') || errorMessage.includes('404'))) {
        modelsNeedingCleanup.add(url);
      }
      
      // Don't retry failed URLs
      failedUrls.add(url);
      modelLoadStates.set(url, 'error');
      saveCacheToStorage();
      if (onProgress) {
        onProgress(loaded, total); // Still update progress even on error
      }
    }
  });
  
  await Promise.allSettled(loadPromises);
  console.log(`Batch load complete: ${loaded} loaded, ${errors} failed, ${total} total`);
  
  // Reset batch loading flag
  isBatchLoading = false;
};

/**
 * Store combination keys for all model variants
 * @param models Array of models to extract combinations from
 */
export const trackModelCombinations = (models: ThreeDModel[]): Set<string> => {
  const modelTypes = new Set<string>();
  const cornerStyles = new Set<string>();
  const magnetsOptions = new Set<string>();
  
  models.forEach(model => {
    const defaultOptions = model.default_options || {};
    if (defaultOptions.modelType) modelTypes.add(defaultOptions.modelType);
    if (defaultOptions.corners) cornerStyles.add(defaultOptions.corners);
    if (defaultOptions.magnets) magnetsOptions.add(defaultOptions.magnets);
  });
  
  const allCombinations = new Set<string>();
  modelTypes.forEach(modelType => {
    cornerStyles.forEach(corners => {
      magnetsOptions.forEach(magnets => {
        allCombinations.add(`${modelType}-${corners}-${magnets}`);
      });
    });
  });
  
  preloadedCombinations.clear();
  allCombinations.forEach(combo => preloadedCombinations.add(combo));
  
  return allCombinations;
};

/**
 * Check if a combination has been preloaded
 * @param combinationKey The combination key to check
 * @returns True if the combination is ready for morphing
 */
export const isCombinationPreloaded = (combinationKey: string): boolean => {
  return preloadedCombinations.has(combinationKey);
};

/**
 * Reset the loader state to prevent stale data between sessions
 */
export const resetLoaderState = (): void => {
  modelLoadStates.clear();
  failedUrls.clear();
  modelsNeedingCleanup.clear();
  preloadedCombinations.clear();
  isBatchLoading = false;
  
  // Also clear the storage cache
  localStorage.removeItem('modelPreloaderCache');
};

/**
 * Check if a model is already preloaded
 * @param url The URL to check
 * @returns True if the model is preloaded
 */
export const isModelPreloaded = (url: string): boolean => {
  return preloadedGeometries.has(url) && modelLoadStates.get(url) === 'loaded';
};

/**
 * Check if a model is currently being loaded
 * @param url The URL to check
 * @returns True if the model is being loaded
 */
export const isModelLoading = (url: string): boolean => {
  return loadingPromises.has(url) || modelLoadStates.get(url) === 'loading';
};

/**
 * Check if a model loading previously failed
 * @param url The URL to check
 * @returns True if the model failed to load
 */
export const didModelFail = (url: string): boolean => {
  return failedUrls.has(url) || modelLoadStates.get(url) === 'error';
};

/**
 * Get a preloaded geometry if available
 * @param url The URL of the geometry to get
 * @returns The geometry or null if not loaded
 */
export const getPreloadedGeometry = (url: string): THREE.BufferGeometry | null => {
  // Skip failed URLs immediately
  if (failedUrls.has(url)) {
    console.warn(`Attempting to get previously failed URL: ${url}`);
    return null;
  }
  
  if (modelLoadStates.get(url) === 'loaded' && preloadedGeometries.has(url)) {
    const geometry = preloadedGeometries.get(url);
    if (geometry) {
      console.log(`Using preloaded geometry for ${url}`);
      return geometry.clone();
    }
  }
  return null;
};

/**
 * Clear the preload cache
 */
export const clearPreloadCache = (): void => {
  preloadedGeometries.clear();
  loadingPromises.clear();
  modelLoadStates.clear();
  failedUrls.clear();
  modelsNeedingCleanup.clear();
  preloadedCombinations.clear();
  isBatchLoading = false;
  
  // Also clear the storage cache
  localStorage.removeItem('modelPreloaderCache');
};

/**
 * Get preload status 
 * @returns The number of loaded and pending models
 */
export const getPreloadStatus = (): { 
  loaded: number; 
  pending: number;
  failed: number;
  modelsNeedingCleanup: number;
  modelStates: { loading: number; loaded: number; error: number };
  isBatchLoading: boolean;
  combinationsTracked: number;
} => {
  // Count models by state
  let loadingCount = 0;
  let loadedCount = 0;
  let errorCount = 0;
  
  modelLoadStates.forEach(state => {
    if (state === 'loading') loadingCount++;
    if (state === 'loaded') loadedCount++;
    if (state === 'error') errorCount++;
  });
  
  return {
    loaded: preloadedGeometries.size,
    pending: loadingPromises.size,
    failed: failedUrls.size,
    modelsNeedingCleanup: modelsNeedingCleanup.size,
    modelStates: {
      loading: loadingCount,
      loaded: loadedCount,
      error: errorCount
    },
    isBatchLoading,
    combinationsTracked: preloadedCombinations.size
  };
};

/**
 * Get a list of failed URLs for debugging
 * @returns Array of failed URLs
 */
export const getFailedUrls = (): string[] => {
  return Array.from(failedUrls);
};

/**
 * Get a list of models that need cleanup (404/400 errors)
 * @returns Array of model URLs that need to be cleaned up
 */
export const getModelsNeedingCleanup = (): string[] => {
  return Array.from(modelsNeedingCleanup);
};

export default {
  preloadModelGeometry,
  preloadModels,
  trackModelCombinations,
  isCombinationPreloaded,
  isModelPreloaded,
  isModelLoading,
  didModelFail,
  getPreloadedGeometry,
  clearPreloadCache,
  getPreloadStatus,
  resetLoaderState,
  getFailedUrls,
  getModelsNeedingCleanup
};
