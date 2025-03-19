import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeDModel } from '@/types/model';
import { Loader2 } from 'lucide-react';
import { getPreloadedGeometry, isModelPreloaded, preloadModelGeometry, didModelFail } from '@/utils/modelPreloader';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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
      
      if (isMobile) {
        const initialVertexCount = geometry.attributes.position.count;
        console.log(`Mobile device detected. Initial vertex count: ${initialVertexCount}`);
        
        try {
          const simplificationRatio = 0.25;
          const stride = Math.max(1, Math.floor(1 / simplificationRatio));
          
          const positions = geometry.attributes.position.array;
          const normals = geometry.attributes.normal?.array;
          
          const newPositions = new Float32Array(Math.ceil(positions.length / (stride * 3)) * 3);
          let newNormals = null;
          if (normals) {
            newNormals = new Float32Array(Math.ceil(normals.length / (stride * 3)) * 3);
          }
          
          let newIndex = 0;
          for (let i = 0; i < positions.length; i += stride * 3) {
            newPositions[newIndex] = positions[i];
            newPositions[newIndex + 1] = positions[i + 1];
            newPositions[newIndex + 2] = positions[i + 2];
            
            if (newNormals && normals) {
              newNormals[newIndex] = normals[i];
              newNormals[newIndex + 1] = normals[i + 1];
              newNormals[newIndex + 2] = normals[i + 2];
            }
            
            newIndex += 3;
          }
          
          const newGeometry = new THREE.BufferGeometry();
          newGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions.slice(0, newIndex), 3));
          
          if (newNormals) {
            newGeometry.setAttribute('normal', new THREE.BufferAttribute(newNormals.slice(0, newIndex), 3));
          } else {
            newGeometry.computeVertexNormals();
          }
          
          newGeometry.center();
          
          console.log(`Simplified geometry for mobile. New vertex count: ${newGeometry.attributes.position.count}`);
          console.log(`Reduction: ${((1 - newGeometry.attributes.position.count / initialVertexCount) * 100).toFixed(1)}%`);
          
          globalGeometryCache.set(url, newGeometry.clone());
          return newGeometry;
        } catch (simplifyError) {
          console.error('Error simplifying geometry for mobile:', simplifyError);
          console.log('Using original geometry as fallback');
        }
      }
      
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
      
      const shouldMorph = prevUrl && prevUrl !== url && morphEnabled && preloadComplete && !isMobile;
      
      try {
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
          const loadingPromise = loadGeometry(url);
          const timeoutPromise = new Promise((_, reject) => {
            if (isMobile) {
              setTimeout(() => {
                reject(new Error('Loading timed out on mobile device'));
              }, 15000);
            }
          });
          
          newGeometry = isMobile 
            ? await Promise.race([loadingPromise, timeoutPromise]) 
            : await loadingPromise;
          
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
            if (preserveExistingModel && currentGeometry && !isMobile) {
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
          
          if (preserveExistingModel && currentGeometry && !isMobile) {
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
  }, [url, prevUrl, morphEnabled, loadedModels, onModelsLoaded, preloadComplete, preserveExistingModel, isMobile]);
  
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
    
    if (isMobile) {
      return new THREE.MeshStandardMaterial({ 
        color, 
        roughness: 0.5, 
        metalness: 0.2,
      });
    }
    
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
      {previousGeometry && isTransitioning && !isMobile && (
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
            transparent={isTransitioning && !isMobile}
            opacity={isTransitioning && !isMobile ? morphProgress : 1}
          />
        </mesh>
      )}
    </group>
  );
};

const ModelRotationControls = ({ modelRef }: { modelRef: React.RefObject<THREE.Group> }) => {
  const { gl, camera, scene } = useThree();
  const rotationActive = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });
  const initialRotation = useRef({ x: 0, y: 0 });
  const isTouchDevice = useRef(false);
  
  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (gl.domElement && !isTouchDevice.current) {
      gl.domElement.style.cursor = 'grab';
    }
    
    const saveStartRotation = () => {
      if (modelRef.current) {
        initialRotation.current = {
          x: modelRef.current.rotation.x,
          y: modelRef.current.rotation.y
        };
      }
    };
    
    const onPointerDown = (event: PointerEvent) => {
      if (event.target === gl.domElement && (event.button === 0 || event.pointerType === 'touch')) {
        event.preventDefault();
        rotationActive.current = true;
        lastPointerPosition.current = { x: event.clientX, y: event.clientY };
        saveStartRotation();
        
        if (!isTouchDevice.current) {
          gl.domElement.style.cursor = 'grabbing';
        }
        
        try {
          (gl.domElement as HTMLElement).setPointerCapture(event.pointerId);
        } catch (err) {
          console.error('Error capturing pointer:', err);
        }
      }
    };
    
    const onPointerMove = (event: PointerEvent) => {
      if (!rotationActive.current || !modelRef.current) return;
      
      const deltaX = event.clientX - lastPointerPosition.current.x;
      const deltaY = event.clientY - lastPointerPosition.current.y;
      
      const sensitivity = isTouchDevice.current ? 0.008 : 0.005;
      
      modelRef.current.rotation.y = initialRotation.current.y - deltaX * sensitivity;
      modelRef.current.rotation.x = initialRotation.current.x - deltaY * sensitivity;
      
      gl.render(scene, camera);
    };
    
    const onPointerUp = (event: PointerEvent) => {
      if (rotationActive.current) {
        rotationActive.current = false;
        
        if (!isTouchDevice.current) {
          gl.domElement.style.cursor = 'grab';
        }
        
        try {
          (gl.domElement as HTMLElement).releasePointerCapture(event.pointerId);
        } catch (err) {
          console.error('Error releasing pointer capture:', err);
        }
      }
    };
    
    const onPointerCancel = (event: PointerEvent) => {
      rotationActive.current = false;
      if (!isTouchDevice.current) {
        gl.domElement.style.cursor = 'grab';
      }
    };
    
    const onBlur = () => {
      rotationActive.current = false;
      if (!isTouchDevice.current) {
        gl.domElement.style.cursor = 'grab';
      }
    };
    
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onBlur);
    
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('blur', onBlur);
      
      if (!isTouchDevice.current) {
        gl.domElement.style.cursor = 'auto';
      }
    };
  }, [gl, modelRef, camera, scene]);
  
  return null;
};

interface ModelViewerContentProps {
  model: ThreeDModel | null;
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
  const isMobile = useIsMobile();
  
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
        shadows={!isMobile}
        dpr={isMobile ? 1 : [1, 2]}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          if (!isMobile) {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }
        }}
        gl={{ 
          antialias: !isMobile,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: isMobile ? 'low-power' : 'high-performance'
        }}
        frameloop={isMobile ? "demand" : "always"}
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
        {isMobile ? (
          <directionalLight 
            position={[0, 200, 200]} 
            intensity={1.0} 
          />
        ) : (
          <>
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
          </>
        )}
        
        <Suspense fallback={null}>
          {model?.stl_file_path ? (
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
          ) : (
            <mesh>
              <boxGeometry args={[100, 100, 100]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
          )}
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
  model: ThreeDModel | null;
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
  const isMobile = useIsMobile();
  
  const effectiveOptions = model?.default_options 
    ? { ...model.default_options, ...customizationOptions }
    : customizationOptions;
  
  if (!model) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading models...</p>
        </div>
      </div>
    );
  }

  const containerHeight = isMobile ? "h-[400px]" : "h-full";

  return (
    <div className={`w-full ${containerHeight} bg-white rounded-lg relative`}>
      {viewerError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 z-10 text-sm">
          {viewerError}
        </div>
      )}
      
      {isMobile && (
        <div className="absolute top-3 right-3 z-10 bg-white/80 px-3 py-1.5 rounded-md text-xs font-medium">
          Mobile Mode
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
