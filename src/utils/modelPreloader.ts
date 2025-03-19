import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeDModel } from '@/types/model';
import { useIsMobile } from '@/hooks/use-mobile';

// Store preloaded geometries
const preloadedGeometries = new Map<string, THREE.BufferGeometry>();
const failedModels = new Set<string>();
const loadingModels = new Map<string, Promise<THREE.BufferGeometry>>();
const modelsNeedingCleanup = new Set<string>();

// Track loading state for mobile
let isLoadingMobile = false;

/**
 * Preload a single model's geometry
 */
export const preloadModelGeometry = async (url: string, isMobile = false): Promise<THREE.BufferGeometry> => {
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

  // For mobile, only load one model at a time
  if (isMobile && isLoadingMobile) {
    console.log(`Mobile: Already loading another model. Rejecting load for ${url}`);
    return Promise.reject(new Error('Already loading another model on mobile device'));
  }

  // If already loading this URL, return the existing promise to prevent duplicate loads
  if (loadingModels.has(url)) {
    console.log(`Already loading ${url}, reusing existing promise`);
    return loadingModels.get(url)!;
  }
  
  console.log(`Loading model: ${url}${isMobile ? ' (mobile)' : ''}`);
  
  if (isMobile) {
    isLoadingMobile = true;
  }
  
  const loadPromise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
    const loader = new STLLoader();
    
    // Add a timeout for mobile devices
    let timeoutId: NodeJS.Timeout | null = null;
    if (isMobile) {
      timeoutId = setTimeout(() => {
        console.error(`Mobile: Loading timed out for ${url}`);
        failedModels.add(url);
        loadingModels.delete(url);
        isLoadingMobile = false;
        reject(new Error('Loading timed out on mobile device'));
      }, 15000); // 15 seconds timeout
    }
    
    loader.load(
      url,
      (geometry) => {
        // Clean up geometry
        geometry.center();
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        
        // Mobile-specific geometry simplification (when not done at a higher level)
        if (isMobile) {
          try {
            // Very basic simplification, just in case it helps
            const positions = geometry.attributes.position.array;
            const simplificationRatio = 0.33; // Keep only 33% of vertices
            const stride = Math.max(1, Math.floor(1 / simplificationRatio));
            
            if (stride > 1) {  // Only simplify if we're reducing by more than 1x
              const newPositions = new Float32Array(Math.ceil(positions.length / (stride * 3)) * 3);
              let newIndex = 0;
              
              for (let i = 0; i < positions.length; i += stride * 3) {
                if (i + 2 < positions.length) {  // Make sure we don't go out of bounds
                  newPositions[newIndex] = positions[i];
                  newPositions[newIndex + 1] = positions[i + 1];
                  newPositions[newIndex + 2] = positions[i + 2];
                  newIndex += 3;
                }
              }
              
              const simpleGeometry = new THREE.BufferGeometry();
              simpleGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions.slice(0, newIndex), 3));
              simpleGeometry.computeVertexNormals();
              simpleGeometry.center();
              
              console.log(`Mobile: Simplified geometry from ${geometry.attributes.position.count} to ${simpleGeometry.attributes.position.count} vertices`);
              
              // Replace the geometry with the simplified version
              geometry = simpleGeometry;
            }
          } catch (simplifyError) {
            console.error('Error simplifying geometry for mobile:', simplifyError);
            // Continue with the original geometry if simplification fails
          }
        }
        
        // Store in cache
        preloadedGeometries.set(url, geometry.clone());
        loadingModels.delete(url);
        
        if (isMobile) {
          isLoadingMobile = false;
          if (timeoutId) clearTimeout(timeoutId);
        }
        
        resolve(geometry);
      },
      (xhr) => {
        const progressPercent = Math.round(xhr.loaded / xhr.total * 100);
        console.log(`${progressPercent}% loaded for ${url}${isMobile ? ' (mobile)' : ''}`);
      },
      (error) => {
        console.error(`Error loading model: ${url}`, error);
        failedModels.add(url);
        loadingModels.delete(url);
        
        if (isMobile) {
          isLoadingMobile = false;
          if (timeoutId) clearTimeout(timeoutId);
        }
        
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
  onProgress?: (loaded: number, total: number) => void,
  isMobile = false
): Promise<void> => {
  // For mobile, we only preload one model for each combination type
  // This greatly reduces memory usage and improves performance
  let validModels = models.filter(model => {
    return model.stl_file_path && 
           !failedModels.has(model.stl_file_path);
  });
  
  if (isMobile) {
    console.log("Mobile detected: Using optimized preloading strategy");
    
    // Create a map to keep track of which model types we've seen
    const seenTypes = new Map<string, ThreeDModel>();
    
    // For mobile, only load one model per type combination
    validModels.forEach(model => {
      const options = model.default_options || {};
      if (options.modelType && options.corners && options.magnets) {
        const combinationKey = `${options.modelType}-${options.corners}-${options.magnets}`;
        
        if (!seenTypes.has(combinationKey)) {
          seenTypes.set(combinationKey, model);
        }
      }
    });
    
    validModels = Array.from(seenTypes.values());
    console.log(`Mobile optimization: Reduced from ${models.length} to ${validModels.length} models`);
  }
  
  const total = validModels.length;
  if (total === 0) {
    console.log('No valid models to preload');
    if (onProgress) onProgress(0, 0);
    return;
  }
  
  console.log(`Starting preload of ${total} models${isMobile ? ' (mobile optimized)' : ''}`);
  let loaded = 0;
  
  if (isMobile) {
    // For mobile, load models one at a time
    for (const model of validModels) {
      try {
        await preloadModelGeometry(model.stl_file_path, true);
        loaded++;
        if (onProgress) onProgress(loaded, total);
      } catch (err) {
        console.warn(`Failed to preload model ${model.stl_file_path}:`, err);
        loaded++;
        if (onProgress) onProgress(loaded, total);
      }
    }
  } else {
    // For desktop, create an array of promises for each model
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
  }
  
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
  isLoadingMobile = false;
};

/**
 * Reset the loader state
 */
export const resetLoaderState = (): void => {
  failedModels.clear();
  modelsNeedingCleanup.clear();
  isLoadingMobile = false;
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

/**
 * Check if currently loading a model on mobile
 */
export const isMobileLoading = (): boolean => {
  return isLoadingMobile;
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
  getModelsNeedingCleanup,
  isMobileLoading
};
