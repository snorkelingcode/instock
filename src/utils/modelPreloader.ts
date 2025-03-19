
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeDModel } from '@/types/model';

// Global cache for preloaded geometries
const preloadedGeometries = new Map<string, THREE.BufferGeometry>();
// Track ongoing load operations to prevent duplicate loads
const loadingPromises = new Map<string, Promise<THREE.BufferGeometry>>();

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
      return cachedGeometry.clone();
    }
  }
  
  // If this URL is already being loaded, return that promise instead of starting a new load
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url) as Promise<THREE.BufferGeometry>;
  }
  
  // Create a new load promise
  const loadPromise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
    const loader = new STLLoader();
    
    loader.load(
      url,
      (geometry) => {
        geometry.center();
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        // Store in cache
        preloadedGeometries.set(url, geometry.clone());
        // Remove from loading promises once done
        loadingPromises.delete(url);
        // Return the geometry
        resolve(geometry);
      },
      (xhr) => {
        console.log(`${Math.round(xhr.loaded / xhr.total * 100)}% loaded for ${url}`);
      },
      (error) => {
        console.error('Error preloading model:', error);
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
  const stlUrls = models
    .filter(model => model.stl_file_path)
    .map(model => model.stl_file_path);
  
  const total = stlUrls.length;
  let loaded = 0;
  
  // Use Promise.all to load all models in parallel
  // We'll create an array of promises, wait for them all to complete
  const loadPromises = stlUrls.map(async (url) => {
    try {
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
};

/**
 * Check if a model is already preloaded
 * @param url The URL to check
 * @returns True if the model is preloaded
 */
export const isModelPreloaded = (url: string): boolean => {
  return preloadedGeometries.has(url);
};

/**
 * Check if a model is currently being loaded
 * @param url The URL to check
 * @returns True if the model is being loaded
 */
export const isModelLoading = (url: string): boolean => {
  return loadingPromises.has(url);
};

/**
 * Get a preloaded geometry if available
 * @param url The URL of the geometry to get
 * @returns The geometry or null if not loaded
 */
export const getPreloadedGeometry = (url: string): THREE.BufferGeometry | null => {
  const geometry = preloadedGeometries.get(url);
  return geometry ? geometry.clone() : null;
};

/**
 * Clear the preload cache
 */
export const clearPreloadCache = (): void => {
  preloadedGeometries.clear();
  loadingPromises.clear();
};

/**
 * Get preload status 
 * @returns The number of loaded and pending models
 */
export const getPreloadStatus = (): { loaded: number; pending: number } => {
  return {
    loaded: preloadedGeometries.size,
    pending: loadingPromises.size
  };
};

export default {
  preloadModelGeometry,
  preloadModels,
  isModelPreloaded,
  isModelLoading,
  getPreloadedGeometry,
  clearPreloadCache,
  getPreloadStatus
};
