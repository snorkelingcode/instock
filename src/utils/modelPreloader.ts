
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

/**
 * Preload a 3D model geometry
 * @param url The URL of the STL file to preload
 * @returns A promise that resolves when the model is loaded
 */
export const preloadModelGeometry = async (url: string): Promise<THREE.BufferGeometry> => {
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
        // Clean up geometry
        geometry.center();
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        
        // Store in cache
        preloadedGeometries.set(url, geometry.clone());
        
        // Update state
        modelLoadStates.set(url, 'loaded');
        
        // Remove from loading promises once done
        loadingPromises.delete(url);
        
        // Return the geometry
        resolve(geometry);
      },
      (xhr) => {
        const progressPercent = Math.round(xhr.loaded / xhr.total * 100);
        console.log(`${progressPercent}% loaded for ${url}`);
      },
      (error) => {
        console.error('Error preloading model:', error);
        // Mark as error in state
        modelLoadStates.set(url, 'error');
        // Remove from loading promises on error
        loadingPromises.delete(url);
        reject(error);
      }
    );
  });
  
  // Store the promise so we don't start duplicate loads
  loadingPromises.set(url, loadPromise);
  
  return loadPromise;
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
  
  const stlUrls = models
    .filter(model => model.stl_file_path)
    .map(model => model.stl_file_path);
  
  const total = stlUrls.length;
  let loaded = 0;
  
  // Use Promise.all to load all models in parallel
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
      
      await preloadModelGeometry(url);
      loaded++;
      if (onProgress) {
        onProgress(loaded, total);
      }
    } catch (error) {
      console.error(`Failed to preload model ${url}:`, error);
    }
  });
  
  await Promise.all(loadPromises);
  console.log(`Successfully preloaded ${loaded} of ${total} models`);
  
  // Reset batch loading flag
  isBatchLoading = false;
};

/**
 * Reset the loader state to prevent stale data between sessions
 */
export const resetLoaderState = (): void => {
  modelLoadStates.clear();
  isBatchLoading = false;
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
 * Get a preloaded geometry if available
 * @param url The URL of the geometry to get
 * @returns The geometry or null if not loaded
 */
export const getPreloadedGeometry = (url: string): THREE.BufferGeometry | null => {
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
  isBatchLoading = false;
};

/**
 * Get preload status 
 * @returns The number of loaded and pending models
 */
export const getPreloadStatus = (): { 
  loaded: number; 
  pending: number;

  modelStates: { loading: number; loaded: number; error: number };
  isBatchLoading: boolean;
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
    modelStates: {
      loading: loadingCount,
      loaded: loadedCount,
      error: errorCount
    },
    isBatchLoading
  };
};

export default {
  preloadModelGeometry,
  preloadModels,
  isModelPreloaded,
  isModelLoading,
  getPreloadedGeometry,
  clearPreloadCache,
  getPreloadStatus,
  resetLoaderState
};
