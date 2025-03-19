
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeDModel } from '@/types/model';
import { Loader2 } from 'lucide-react';

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
}

const ModelDisplay = ({ url, prevUrl, customOptions, modelRef, morphEnabled }: ModelDisplayProps) => {
  const [currentGeometry, setCurrentGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [previousGeometry, setPreviousGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [morphProgress, setMorphProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Create a cache for geometries to avoid reloading the same models
  const geometryCache = useRef<Map<string, THREE.BufferGeometry>>(new Map());
  
  const loadGeometry = async (url: string): Promise<THREE.BufferGeometry> => {
    // Check cache first
    if (geometryCache.current.has(url)) {
      const cachedGeometry = geometryCache.current.get(url);
      if (cachedGeometry) return cachedGeometry.clone();
    }
    
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      
      loader.load(
        url,
        (loadedGeometry) => {
          loadedGeometry.center();
          if (!loadedGeometry.attributes.normal) {
            loadedGeometry.computeVertexNormals();
          }
          // Add to cache
          geometryCache.current.set(url, loadedGeometry.clone());
          resolve(loadedGeometry);
        },
        (xhr) => {
          console.log(`${Math.round(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        (err) => {
          console.error('Error loading STL:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          reject(new Error(`Failed to load model: ${errorMessage}`));
        }
      );
    });
  };
  
  // Preload the next model when morphEnabled changes
  useEffect(() => {
    if (morphEnabled && url && prevUrl && url !== prevUrl) {
      // Preload the new model
      loadGeometry(url).catch(console.error);
    }
  }, [morphEnabled, url, prevUrl]);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadCurrentModel = async () => {
      if (!url) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const newGeometry = await loadGeometry(url);
        
        if (!isMounted) return;
        
        if (prevUrl && prevUrl !== url && morphEnabled) {
          // If we have a previous model and morphing is enabled
          if (currentGeometry) {
            setPreviousGeometry(currentGeometry);
          }
          
          // If we don't already have the previous geometry loaded, load it
          if (!previousGeometry && prevUrl) {
            try {
              const prevGeometry = await loadGeometry(prevUrl);
              if (isMounted) {
                setPreviousGeometry(prevGeometry);
              }
            } catch (err) {
              console.error('Failed to load previous geometry:', err);
            }
          }
          
          setCurrentGeometry(newGeometry);
          setMorphProgress(0);
          setIsTransitioning(true);
        } else {
          setCurrentGeometry(newGeometry);
          setIsTransitioning(false);
        }
        
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load model: ${errorMessage}`);
        setLoading(false);
      }
    };
    
    loadCurrentModel();
    
    return () => {
      isMounted = false;
    };
  }, [url, prevUrl, morphEnabled]);
  
  useFrame((_, delta) => {
    if (isTransitioning && (previousGeometry || currentGeometry)) {
      setMorphProgress((prev) => {
        const newProgress = prev + delta * 2; // Adjust speed here (2 = 0.5 seconds)
        
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
  
  if (loading && !currentGeometry && !previousGeometry) {
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
  const { gl, camera } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true);
      setPreviousMousePosition({ x: event.clientX, y: event.clientY });
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging && modelRef.current) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        
        const rotationSpeed = 0.01;
        
        modelRef.current.rotation.y -= deltaMove.x * rotationSpeed;
        modelRef.current.rotation.x -= deltaMove.y * rotationSpeed;
        
        setPreviousMousePosition({ x: event.clientX, y: event.clientY });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gl, modelRef, isDragging, previousMousePosition]);
  
  return null;
};

interface ModelViewerContentProps {
  model: ThreeDModel;
  previousModel: ThreeDModel | null;
  effectiveOptions: Record<string, any>;
  morphEnabled: boolean;
}

const ModelViewerContent = ({ model, previousModel, effectiveOptions, morphEnabled }: ModelViewerContentProps) => {
  const modelRef = useRef<THREE.Group>(null);
  
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
      >
        <color attach="background" args={["#FFFFFF"]} />
        
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
}

const ModelViewer: React.FC<ModelViewerProps> = ({ 
  model, 
  previousModel, 
  customizationOptions,
  morphEnabled
}) => {
  const [viewerError, setViewerError] = useState<string | null>(null);
  
  const effectiveOptions = {
    ...model.default_options,
    ...customizationOptions
  };
  
  if (!model || !model.stl_file_path) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-white">No model available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg relative">
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
      />
    </div>
  );
};

export default ModelViewer;
