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
  
  const loadGeometry = async (url: string): Promise<THREE.BufferGeometry> => {
    if (!url || url.trim() === '') {
      console.error('Invalid URL provided to loadGeometry');
      return Promise.reject(new Error('Invalid URL'));
    }
    
    if (didModelFail(url)) {
      console.warn(`Skipping previously failed URL: ${url}`);
      return Promise.reject(new Error(`URL previously failed: ${url}`));
    }
    
    if (getPreloadedGeometry(url)) {
      console.log(`Using preloaded geometry for ${url}`);
      return getPreloadedGeometry(url).clone();
    }
    
    if (loadedModels.has(url)) {
      const cachedGeometry = loadedModels.get(url);
      if (cachedGeometry) {
        console.log(`Using geometry from component cache for ${url}`);
        return cachedGeometry.clone();
      }
    }
    
    if (globalGeometryCache.has(url)) {
      const cachedGeometry = globalGeometryCache.get(url);
      if (cachedGeometry) {
        console.log(`Using geometry from global cache for ${url}`);
        return cachedGeometry.clone();
      }
    }
    
    console.log(`No cached geometry found for ${url}, loading from server`);
    try {
      const geometry = await preloadModelGeometry(url);
      globalGeometryCache.set(url, geometry.clone());
      return geometry;
    } catch (error) {
      console.error(`Error loading geometry for ${url}:`, error);
      throw error;
    }
  };
  
  useEffect(() => {
    let isMounted = true;
    
    if (lastUrlRef.current === url && currentGeometry) {
      console.log(`Model ${url} is already loaded, skipping reload`);
      return;
    }
    
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
        const shouldMorph = prevUrl && prevUrl !== url && morphEnabled && preloadComplete;
        let previousGeometryLoaded = null;
        
        if (shouldMorph && prevUrl) {
          try {
            if (currentGeometry && lastUrlRef.current === prevUrl) {
              console.log(`Using current geometry as previous for morphing from ${prevUrl}`);
              previousGeometryLoaded = currentGeometry.clone();
            } else {
              previousGeometryLoaded = await loadGeometry(prevUrl);
            }
            morphAttempted.current = true;
          } catch (err) {
            console.error(`Failed to load previous model for morphing: ${prevUrl}`, err);
          }
        }
        
        let newGeometry;
        
        try {
          if (isModelPreloaded(url) || globalGeometryCache.has(url) || loadedModels.has(url)) {
            newGeometry = await loadGeometry(url);
            console.log(`Fast path: Using cached/preloaded geometry for ${url}`);
          } else {
            newGeometry = await loadGeometry(url);
          }
          
          if (!isMounted) return;
          
          globalGeometryCache.set(url, newGeometry.clone());
          onModelsLoaded(url, newGeometry.clone());
          
          if (!initialLoadCompleted.current) {
            console.log(`Initial load complete for ${url}`);
            initialLoadCompleted.current = true;
          }
          
          if (shouldMorph && previousGeometryLoaded) {
            console.log(`Morphing from ${prevUrl} to ${url}`);
            setPreviousGeometry(previousGeometryLoaded);
            setCurrentGeometry(newGeometry);
            setMorphProgress(0);
            setIsTransitioning(true);
          } else {
            if (preserveExistingModel && currentGeometry) {
              setPreviousGeometry(currentGeometry.clone());
              setCurrentGeometry(newGeometry);
              setMorphProgress(0);
              setIsTransitioning(true);
            } else {
              setCurrentGeometry(newGeometry);
              setIsTransitioning(false);
            }
          }
          
          lastUrlRef.current = url;
        } catch (geometryErr) {
          console.error(`Failed to load geometry for ${url}:`, geometryErr);
          setError(`Failed to load model geometry: ${geometryErr.message || 'Unknown error'}`);
          
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
  
  useFrame((_, delta) => {
    if (isTransitioning && (previousGeometry || currentGeometry)) {
      setMorphProgress((prev) => {
        const newProgress = prev + delta * 2;
        
        if (newProgress >= 1) {
          setIsTransitioning(false);
          setPreviousGeometry(null);
          return 1;
        }
        
        return newProgress;
      });
    }
  });
  
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
  
  const shouldShowLoadingIndicator = loading && !currentGeometry && !previousGeometry;
  
  if (shouldShowLoadingIndicator && !initialLoadCompleted.current) {
    return null;
  }
  
  if (error && !currentGeometry && !previousGeometry) {
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

const ModelRotationControls = ({ modelRef }: { modelRef: React.RefObject<THREE.Group> }) => {
  const { gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!modelRef.current) return;
    
    const handlePointerDown = (event: PointerEvent) => {
      if (!modelRef.current) return;
      
      if (event.target === gl.domElement) {
        setIsDragging(true);
        setPreviousMousePosition({ 
          x: event.clientX, 
          y: event.clientY 
        });
        gl.domElement.style.cursor = 'grabbing';
        event.preventDefault();
      }
    };
    
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || !modelRef.current) return;
      
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };
      
      const rotationSpeed = 0.005;
      
      modelRef.current.rotation.y += deltaMove.x * rotationSpeed;
      modelRef.current.rotation.x += deltaMove.y * rotationSpeed;
      
      setPreviousMousePosition({ 
        x: event.clientX, 
        y: event.clientY 
      });
    };
    
    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        gl.domElement.style.cursor = 'grab';
      }
    };
    
    const handlePointerLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        gl.domElement.style.cursor = 'grab';
      }
    };
    
    gl.domElement.style.cursor = 'grab';
    
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointerleave', handlePointerLeave);
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointerleave', handlePointerLeave);
      
      gl.domElement.style.cursor = 'auto';
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
