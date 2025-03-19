
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeDModel } from '@/types/model';

// Store preloaded geometries
const preloadedGeometries = new Map<string, THREE.BufferGeometry>();
const failedModels = new Set<string>();
const loadingModels = new Map<string, Promise<THREE.BufferGeometry>>();
const modelsNeedingCleanup = new Set<string>();

/**
 * Preload a single model's geometry
 */
export const preloadModelGeometry = async (url: string): Promise<THREE.BufferGeometry> => {
  if (!url || url.trim() === '') {
    return Promise.reject(new Error('Invalid URL provided'));
  }

  if (failedModels.has(url)) {
    return Promise.reject(new Error(`Model previously failed to load: ${url}`));
  }
  
  if (preloadedGeometries.has(url)) {
    console.log(`Using cached geometry for ${url}`);
    return preloadedGeometries.get(url)!.clone();
  }

  // If already loading this URL, return the existing promise to prevent duplicate loads
  if (loadingModels.has(url)) {
    console.log(`Already loading ${url}, reusing existing promise`);
    return loadingModels.get(url)!;
  }
  
  console.log(`Loading model: ${url}`);
  const loadPromise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
    const loader = new STLLoader();
    
    loader.load(
      url,
      (geometry) => {
        // Clean up geometry
        geometry.center();
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        
        // Store in cache
        preloadedGeometries.set(url, geometry.clone());
        loadingModels.delete(url);
        
        resolve(geometry);
      },
      (xhr) => {
        const progressPercent = Math.round(xhr.loaded / xhr.total * 100);
        console.log(`${progressPercent}% loaded for ${url}`);
      },
      (error) => {
        console.error(`Error loading model: ${url}`, error);
        failedModels.add(url);
        loadingModels.delete(url);
        
        // Check if it's a 404 error to mark for cleanup
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('404') || errorMessage.includes('400')) {
          modelsNeedingCleanup.add(url);
        }
        
        reject(error);
      }
    );
  });
  
  // Store the promise
  loadingModels.set(url, loadPromise);
  
  return loadPromise;
};

/**
 * Preload a collection of models at once
 */
export const preloadModels = async (
  models: ThreeDModel[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> => {
  // Filter out models that have previously failed or have no valid STL path
  const validModels = models.filter(model => {
    return model.stl_file_path && 
           !failedModels.has(model.stl_file_path);
  });
  
  const total = validModels.length;
  if (total === 0) {
    console.log('No valid models to preload');
    if (onProgress) onProgress(0, 0);
    return;
  }
  
  console.log(`Starting preload of ${total} models`);
  let loaded = 0;
  
  // Create an array of promises for each model
  const loadPromises = validModels.map(model => {
    return preloadModelGeometry(model.stl_file_path)
      .then(() => {
        loaded++;
        if (onProgress) onProgress(loaded, total);
        return null;
      })
      .catch(err => {
        console.warn(`Failed to preload model ${model.stl_file_path}:`, err);
        loaded++;
        if (onProgress) onProgress(loaded, total);
        return null;
      });
  });
  
  // Wait for all preloads to complete, but don't fail if individual ones fail
  await Promise.allSettled(loadPromises);
  console.log(`Preloaded ${preloadedGeometries.size} models successfully`);
};

/**
 * Track all possible model combinations for morphing
 */
export const trackModelCombinations = (models: ThreeDModel[]): Set<string> => {
  const combinations = new Set<string>();
  
  models.forEach(model => {
    const options = model.default_options || {};
    if (options.modelType && options.corners && options.magnets) {
      combinations.add(`${options.modelType}-${options.corners}-${options.magnets}`);
    }
  });
  
  return combinations;
};

/**
 * Check if a combination has been preloaded for morphing
 */
export const isCombinationPreloaded = (combinationKey: string): boolean => {
  return true; // Simplified implementation
};

/**
 * Check if a model is already preloaded
 */
export const isModelPreloaded = (url: string): boolean => {
  return preloadedGeometries.has(url);
};

/**
 * Check if a model previously failed to load
 */
export const didModelFail = (url: string): boolean => {
  return failedModels.has(url);
};

/**
 * Get a preloaded geometry if available
 */
export const getPreloadedGeometry = (url: string): THREE.BufferGeometry | null => {
  if (preloadedGeometries.has(url)) {
    return preloadedGeometries.get(url)!.clone();
  }
  return null;
};

/**
 * Clear the preload cache
 */
export const clearPreloadCache = (): void => {
  preloadedGeometries.clear();
  failedModels.clear();
  loadingModels.clear();
  modelsNeedingCleanup.clear();
};

/**
 * Reset the loader state
 */
export const resetLoaderState = (): void => {
  failedModels.clear();
  modelsNeedingCleanup.clear();
};

/**
 * Get preload status info
 */
export const getPreloadStatus = (): { 
  loaded: number; 
  pending: number;
  failed: number;
  isBatchLoading: boolean;
} => {
  return {
    loaded: preloadedGeometries.size,
    pending: loadingModels.size,
    failed: failedModels.size,
    isBatchLoading: loadingModels.size > 0
  };
};

/**
 * Get a list of failed URLs
 */
export const getFailedUrls = (): string[] => {
  return Array.from(failedModels);
};

/**
 * Get a list of models that need cleanup (404/400 errors)
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
  didModelFail,
  getPreloadedGeometry,
  clearPreloadCache,
  getPreloadStatus,
  resetLoaderState,
  getFailedUrls,
  getModelsNeedingCleanup
};
