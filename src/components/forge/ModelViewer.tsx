// src/components/forge/ModelViewer.tsx
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeDModel } from '@/types/model';
import { Loader2 } from 'lucide-react';
import { getPreloadedGeometry, isModelPreloaded, preloadModelGeometry, didModelFail } from '@/utils/modelPreloader';

// Shared geometry cache to prevent reloading same models
const globalGeometryCache = new Map<string, THREE.BufferGeometry>();

const SceneSetup = ({ 
  modelRef 
}: { 
  modelRef: React.RefObject<THREE.Group> 
}) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 500, 0);
    const degToRad = (deg: number) => deg * (Math.PI / 180);
    camera.rotation.set(
      degToRad(-90),
      degToRad(-0.00),
      degToRad(-180)
    );
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
};

interface ModelDisplayProps {
  url: string;
  prevUrl: string | null;
  customOptions: Record<string, any>;
  modelRef: React.RefObject<THREE.Group>;
  morphEnabled: boolean;
  loadedModels: Map<string, THREE.BufferGeometry>;
  onModelsLoaded: (url: string, geometry: THREE.BufferGeometry) => void;
  preloadComplete: boolean;
  preserveExistingModel: boolean;
}

const ModelDisplay = ({ 
  url, 
  prevUrl, 
  customOptions, 
  modelRef, 
  morphEnabled,
  loadedModels,
  onModelsLoaded,
  preloadComplete,
  preserveExistingModel
}: ModelDisplayProps) => {
  const [currentGeometry, setCurrentGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [previousGeometry, setPreviousGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [morphProgress, setMorphProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastUrlRef = useRef<string | null>(null);
  const morphAttempted = useRef<boolean>(false);
  const initialLoadCompleted = useRef<boolean>(false);
  
  // Enhanced geometry loading with multiple cache layers
  const loadGeometry = async (url: string): Promise<THREE.BufferGeometry> => {
    if (!url || url.trim() === '') {
      console.error('Invalid URL provided to loadGeometry');
      return Promise.reject(new Error('Invalid URL'));
    }
    
    if (didModelFail(url)) {
      console.warn(`Skipping previously failed URL: ${url}`);
      return Promise.reject(new Error(`URL previously failed: ${url}`));
    }
    
    // Priority 1: Get from preloaded geometries (global application cache)
    const preloadedGeometry = getPreloadedGeometry(url);
    if (preloadedGeometry) {
      console.log(`Using preloaded geometry for ${url}`);
      return preloadedGeometry.clone(); // Use clone() to prevent modifying the cached original
    }
    
    // Priority 2: Check component-level cache
    if (loadedModels.has(url)) {
      const cachedGeometry = loadedModels.get(url);
      if (cachedGeometry) {
        console.log(`Using geometry from component cache for ${url}`);
        return cachedGeometry.clone();
      }
    }
    
    // Priority 3: Check global cache
    if (globalGeometryCache.has(url)) {
      const cachedGeometry = globalGeometryCache.get(url);
      if (cachedGeometry) {
        console.log(`Using geometry from global cache for ${url}`);
        return cachedGeometry.clone();
      }
    }
    
    // Last resort: Load from server
    console.log(`No cached geometry found for ${url}, loading from server`);
    try {
      const geometry = await preloadModelGeometry(url);
      // Store in global cache for future use
      globalGeometryCache.set(url, geometry.clone());
      return geometry;
    } catch (error) {
      console.error(`Error loading geometry for ${url}:`, error);
      throw error;
    }
  };
  
  // Load geometries when URL changes - with improved morphing
  useEffect(() => {
    let isMounted = true;
    
    // Skip loading if both URLs are the same
    if (lastUrlRef.current === url && currentGeometry) {
      console.log(`Model ${url} is already loaded, skipping reload`);
      return;
    }
    
    // Don't show loading state if we have preloaded models and after initial load
    const shouldShowLoading = !preloadComplete && !currentGeometry;
    if (shouldShowLoading) {
      setLoading(true);
    }
    
    const loadCurrentModel = async () => {
      if (!url) return;
      
      if (didModelFail(url)) {
        console.warn(`Not loading previously failed URL: ${url}`);
        setError(`Failed to load model: URL previously failed`);
        setLoading(false);
        return;
      }
      
      setError(null);
      
      try {
        // Always attempt to load the previous model first if it exists and morphing is enabled
        const shouldMorph = prevUrl && prevUrl !== url && morphEnabled && preloadComplete;
        let previousGeometryLoaded = null;
        
        if (shouldMorph && prevUrl) {
          try {
            // Check if previous model was already loaded in current scene first
            if (currentGeometry && lastUrlRef.current === prevUrl) {
              console.log(`Using current geometry as previous for morphing from ${prevUrl}`);
              previousGeometryLoaded = currentGeometry.clone();
            } else {
              previousGeometryLoaded = await loadGeometry(prevUrl);
            }
            // Keep track that we attempted morphing
            morphAttempted.current = true;
          } catch (err) {
            console.error(`Failed to load previous model for morphing: ${prevUrl}`, err);
            // Even if previous geometry fails, continue with current model
          }
        }
        
        // Load current model - first check if it's preloaded
        let newGeometry;
        
        try {
          // Use a faster path for preloaded models to avoid loading indicators
          if (isModelPreloaded(url) || globalGeometryCache.has(url) || loadedModels.has(url)) {
            newGeometry = await loadGeometry(url);
            console.log(`Fast path: Using cached/preloaded geometry for ${url}`);
          } else {
            // This is a slower path that will trigger loading indicators if needed
            newGeometry = await loadGeometry(url);
          }
          
          if (!isMounted) return;
          
          // Store in caches
          globalGeometryCache.set(url, newGeometry.clone());
          onModelsLoaded(url, newGeometry.clone());
          
          // Track initial load properly
          if (!initialLoadCompleted.current) {
            console.log(`Initial load complete for ${url}`);
            initialLoadCompleted.current = true;
          }
          
          // Set up morphing if previous geometry was loaded
          if (shouldMorph && previousGeometryLoaded) {
            console.log(`Morphing from ${prevUrl} to ${url}`);
            setPreviousGeometry(previousGeometryLoaded);
            setCurrentGeometry(newGeometry);
            setMorphProgress(0);
            setIsTransitioning(true);
          } else {
            // Keep existing model visible during transition if preserveExistingModel is true
            if (preserveExistingModel && currentGeometry) {
              // Start a seamless transition even if we don't have the previous model
              setPreviousGeometry(currentGeometry.clone());
              setCurrentGeometry(newGeometry);
              setMorphProgress(0);
              setIsTransitioning(true);
            } else {
              // Direct swap without morphing
              setCurrentGeometry(newGeometry);
              setIsTransitioning(false);
            }
          }
          
          // Only update lastUrlRef after successful load
          lastUrlRef.current = url;
        } catch (geometryErr) {
          console.error(`Failed to load geometry for ${url}:`, geometryErr);
          setError(`Failed to load model geometry: ${geometryErr.message || 'Unknown error'}`);
          
          // If we have a current geometry, keep it visible rather than showing an error
          if (preserveExistingModel && currentGeometry) {
            console.log(`Keeping existing model visible due to load error`);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Failed to load model ${url}:`, errorMessage);
        setError(`Failed to load model: ${errorMessage}`);
      } finally {
        // Always turn off loading state when done
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadCurrentModel();
    
    return () => {
      isMounted = false;
    };
  }, [url, prevUrl, morphEnabled, loadedModels, onModelsLoaded, preloadComplete, preserveExistingModel]);
  
  // Handle morphing animation
  useFrame((_, delta) => {
    if (isTransitioning && (previousGeometry || currentGeometry)) {
      setMorphProgress((prev) => {
        const newProgress = prev + delta * 2; // Adjust speed as needed (higher = faster)
        
        if (newProgress >= 1) {
          setIsTransitioning(false);
          setPreviousGeometry(null);
          return 1;
        }
        
        return newProgress;
      });
    }
  });
  
  // Create material based on custom options
  const getMaterial = () => {
    const color = customOptions.color || '#ffffff';
    const material = customOptions.material || 'plastic';
    
    switch(material) {
      case 'metal':
        return new THREE.MeshStandardMaterial({ 
          color, 
          metalness: 0.8, 
          roughness: 0.2,
        });
      case 'wood':
        return new THREE.MeshStandardMaterial({ 
          color, 
          roughness: 0.8, 
          metalness: 0.1,
        });
      case 'plastic':
      default:
        return new THREE.MeshStandardMaterial({ 
          color, 
          roughness: 0.5, 
          metalness: 0.1,
        });
    }
  };
  
  // Show model while loading if we already have a previous geometry
  const shouldShowLoadingIndicator = loading && !currentGeometry && !previousGeometry;
  
  // Only show loading indicator during initial load
  if (shouldShowLoadingIndicator && !initialLoadCompleted.current) {
    return null;
  }
  
  if (error && !currentGeometry && !previousGeometry) {
    // If there's an error and we have nothing to show, render a red box as an error indicator
    return (
      <mesh>
        <boxGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
  
  const scale = customOptions.scale || 0.01;
  
  return (
    <group ref={modelRef}>
      {/* Render previous model during transition */}
      {previousGeometry && isTransitioning && (
        <mesh 
          scale={[scale, scale, scale]}
          castShadow
          receiveShadow
          position={[0, 0, 0]}
          rotation={[Math.PI, Math.PI, Math.PI / 2]}
          visible={morphProgress < 1}
        >
          <primitive object={previousGeometry} attach="geometry" />
          <meshStandardMaterial 
            {...getMaterial()}
            transparent={true}
            opacity={1 - morphProgress}
          />
        </mesh>
      )}
      
      {/* Render current model */}
      {currentGeometry && (
        <mesh 
          scale={[scale, scale, scale]}
          castShadow
          receiveShadow
          position={[0, 0, 0]}
          rotation={[Math.PI, Math.PI, Math.PI / 2]}
        >
          <primitive object={currentGeometry} attach="geometry" />
          <meshStandardMaterial 
            {...getMaterial()}
            transparent={isTransitioning}
            opacity={isTransitioning ? morphProgress : 1}
          />
        </mesh>
      )}
    </group>
  );
};

// Fixed implementation of ModelRotationControls
const ModelRotationControls = ({ modelRef }: { modelRef: React.RefObject<THREE.Group> }) => {
  const { gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!modelRef.current) return;
      
      // Only respond to clicks on the canvas
      if (event.target === gl.domElement) {
        setIsDragging(true);
        setPreviousMousePosition({ x: event.clientX, y: event.clientY });
        event.preventDefault();
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging && modelRef.current) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        
        const rotationSpeed = 0.01;
        
        // Apply rotation to the model
        modelRef.current.rotation.y += deltaMove.x * rotationSpeed;
        modelRef.current.rotation.x += deltaMove.y * rotationSpeed;
        
        setPreviousMousePosition({ x: event.clientX, y: event.clientY });
      }
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      setIsDragging(false);
    };
    
    // Add event listeners to the document for better drag handling
    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add touch event support for mobile devices
    const handleTouchStart = (event: TouchEvent) => {
      if (!modelRef.current || event.touches.length !== 1) return;
      
      setIsDragging(true);
      setPreviousMousePosition({ 
        x: event.touches[0].clientX, 
        y: event.touches[0].clientY 
      });
      event.preventDefault();
    };
    
    const handleTouchMove = (event: TouchEvent) => {
      if (!isDragging || !modelRef.current || event.touches.length !== 1) return;
      
      const deltaMove = {
        x: event.touches[0].clientX - previousMousePosition.x,
        y: event.touches[0].clientY - previousMousePosition.y
      };
      
      const rotationSpeed = 0.01;
      
      modelRef.current.rotation.y += deltaMove.x * rotationSpeed;
      modelRef.current.rotation.x += deltaMove.y * rotationSpeed;
      
      setPreviousMousePosition({ 
        x: event.touches[0].clientX, 
        y: event.touches[0].clientY 
      });
      
      event.preventDefault();
    };
    
    const handleTouchEnd = (event: TouchEvent) => {
      setIsDragging(false);
    };
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl, modelRef, isDragging, previousMousePosition]);
  
  return null;
};

interface ModelViewerContentProps {
  model: ThreeDModel;
  previousModel: ThreeDModel | null;
  effectiveOptions: Record<string, any>;
  morphEnabled: boolean;
  loadedModels: Map<string, THREE.BufferGeometry>;
  onModelsLoaded: (url: string, geometry: THREE.BufferGeometry) => void;
  preloadComplete: boolean;
  preserveExistingModel: boolean;
}

const ModelViewerContent = ({ 
  model, 
  previousModel, 
  effectiveOptions, 
  morphEnabled,
  loadedModels,
  onModelsLoaded,
  preloadComplete,
  preserveExistingModel
}: ModelViewerContentProps) => {
  const modelRef = useRef<THREE.Group>(null);
  const [webGLError, setWebGLError] = useState<string | null>(null);
  
  // Handle WebGL context loss
  useEffect(() => {
    const handleContextLost = () => {
      console.error("WebGL context lost");
      setWebGLError("WebGL context lost. Please refresh the page.");
    };
    
    window.addEventListener('webglcontextlost', handleContextLost);
    
    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, []);
  
  if (webGLError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white p-4">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Graphics Error</p>
          <p>{webGLError}</p>
          <button 
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance'
        }}
        frameloop="demand"
        style={{ cursor: 'grab' }}
      >
        <color attach="background" args={["#F8F9FA"]} />
        
        <SceneSetup modelRef={modelRef} />
        <ModelRotationControls modelRef={modelRef} />
        
        <PerspectiveCamera 
          makeDefault 
          position={[0, 500, 0]} 
          fov={45}
          far={2000}
          near={0.1}
        />
        
        <ambientLight intensity={0.5} />
        <spotLight 
          position={[200, 200, 200]} 
          angle={0.3} 
          penumbra={1} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight 
          position={[100, 200, 100]} 
          intensity={0.8} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048} 
        />
        <directionalLight 
          position={[-100, -100, -100]} 
          intensity={0.3}
        />
        
        <Suspense fallback={null}>
          <ModelDisplay 
            url={model.stl_file_path} 
            prevUrl={previousModel?.stl_file_path || null}
            customOptions={effectiveOptions}
            modelRef={modelRef}
            morphEnabled={morphEnabled}
            loadedModels={loadedModels}
            onModelsLoaded={onModelsLoaded}
            preloadComplete={preloadComplete}
            preserveExistingModel={preserveExistingModel}
          />
        </Suspense>
        
        <OrbitControls 
          enabled={false}
          enablePan={false}
          enableRotate={false}
          enableZoom={false}
          minDistance={50}
          maxDistance={500}
          target={[0, 0, 0]}
          makeDefault
        />
      </Canvas>
    </>
  );
};

interface ModelViewerProps {
  model: ThreeDModel;
  previousModel: ThreeDModel | null;
  customizationOptions: Record<string, any>;
  morphEnabled: boolean;
  loadedModels: Map<string, THREE.BufferGeometry>;
  onModelsLoaded: (url: string, geometry: THREE.BufferGeometry) => void;
  preloadComplete: boolean;
  preserveExistingModel?: boolean;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ 
  model, 
  previousModel, 
  customizationOptions,
  morphEnabled,
  loadedModels,
  onModelsLoaded,
  preloadComplete,
  preserveExistingModel = false
}) => {
  const [viewerError, setViewerError] = useState<string | null>(null);
  
  // Combine default options with user customizations
  const effectiveOptions = {
    ...model.default_options,
    ...customizationOptions
  };
  
  if (!model || !model.stl_file_path) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">No model available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg relative">
      {viewerError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 z-10 text-sm">
          {viewerError}
        </div>
      )}
      
      <ModelViewerContent 
        model={model} 
        previousModel={previousModel}
        effectiveOptions={effectiveOptions} 
        morphEnabled={morphEnabled}
        loadedModels={loadedModels}
        onModelsLoaded={onModelsLoaded}
        preloadComplete={preloadComplete}
        preserveExistingModel={preserveExistingModel}
      />
    </div>
  );
};
