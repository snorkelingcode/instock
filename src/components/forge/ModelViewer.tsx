
import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Center, 
  GizmoHelper, 
  GizmoViewport, 
  Environment,
  Grid,
  Stage,
  useProgress,
  useBounds
} from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useAuth } from '@/contexts/AuthContext';
import { ThreeDModel } from '@/types/model';
import { Loader2 } from 'lucide-react';

interface ModelViewerProps {
  model: ThreeDModel;
  customizationOptions: Record<string, any>;
}

const LoadingScreen = () => {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white z-10">
      <Loader2 className="h-10 w-10 animate-spin mb-2" />
      <div className="text-sm font-medium">{Math.round(progress)}% loaded</div>
    </div>
  );
};

// Smart model container that auto-positions camera based on model dimensions
const SmartModelContainer = ({ children }) => {
  const bounds = useBounds();
  
  useEffect(() => {
    // Automatically fit model to camera view after a short delay
    const timeoutId = setTimeout(() => {
      bounds.refresh().fit();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [bounds]);
  
  return (
    <group>
      {children}
    </group>
  );
};

const ModelDisplay = ({ url, customOptions }: { url: string, customOptions: Record<string, any> }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  const modelRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loader = new STLLoader();
    
    loader.load(
      url,
      (loadedGeometry) => {
        // Center the geometry
        loadedGeometry.center();
        
        // Compute vertex normals if they don't exist
        if (!loadedGeometry.attributes.normal) {
          loadedGeometry.computeVertexNormals();
        }
        
        // Calculate bounding box for smart scaling
        const box = new THREE.Box3().setFromObject(
          new THREE.Mesh(loadedGeometry)
        );
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Set the geometry and its bounding information
        setGeometry(loadedGeometry);
        setBoundingBox(box);
        setLoading(false);
      },
      (xhr) => {
        console.log(`${Math.round(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      (err) => {
        console.error('Error loading STL:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load model: ${errorMessage}`);
        setLoading(false);
      }
    );
    
    return () => {
      setGeometry(null);
      setBoundingBox(null);
    };
  }, [url]);
  
  const getMaterial = () => {
    const color = customOptions.color || '#ffffff';
    const material = customOptions.material || 'plastic';
    
    switch(material) {
      case 'metal':
        return {
          color: color, 
          metalness: 0.8, 
          roughness: 0.2,
        };
      case 'wood':
        return {
          color: color, 
          roughness: 0.8, 
          metalness: 0.1,
        };
      case 'plastic':
      default:
        return {
          color: color, 
          roughness: 0.5, 
          metalness: 0.1,
        };
    }
  };
  
  // Calculate smart scale based on bounding box
  const smartScale = useMemo(() => {
    if (!boundingBox) return 1;
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Get the largest dimension
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Target size we want the model to appear as (in world units)
    const targetSize = 2.5;
    
    // Calculate scale factor to achieve target size
    let scaleFactor = targetSize / maxDimension;
    
    // Apply user scale on top of smart scale
    const userScale = customOptions.scale || 1;
    
    return scaleFactor * userScale;
  }, [boundingBox, customOptions.scale]);
  
  if (loading) {
    return (
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#cccccc" wireframe />
      </mesh>
    );
  }
  
  if (error || !geometry) {
    return (
      <mesh>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
  
  const materialProps = getMaterial();
  
  return (
    <mesh 
      ref={modelRef}
      scale={[smartScale, smartScale, smartScale]}
      castShadow
      receiveShadow
      rotation={[0, 0, 0]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color={materialProps.color}
        metalness={materialProps.metalness} 
        roughness={materialProps.roughness}
      />
    </mesh>
  );
};

const ModelViewer: React.FC<ModelViewerProps> = ({ model, customizationOptions }) => {
  const { user } = useAuth();
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const effectiveOptions = {
    ...model.default_options,
    ...customizationOptions
  };
  
  useEffect(() => {
    // Simulate loading time for Sketchfab-like experience
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [model]);
  
  if (!model || !model.stl_file_path) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-white">No model available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg relative overflow-hidden">
      {viewerError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 z-10 text-sm">
          {viewerError}
        </div>
      )}
      
      {loading && <LoadingScreen />}
      
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: false,
          logarithmicDepthBuffer: true
        }}
        camera={{ position: [-5, 5, 5], fov: 45 }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
        onError={(error) => {
          console.error("Canvas error:", error);
          setViewerError("Error rendering 3D model");
        }}
      >
        <color attach="background" args={['#1a1a1a']} />
        
        <Stage
          preset="rembrandt"
          intensity={1.5}
          environment="city"
          adjustCamera={false}
        >
          <Suspense fallback={null}>
            <SmartModelContainer>
              <ModelDisplay 
                url={model.stl_file_path} 
                customOptions={effectiveOptions} 
              />
            </SmartModelContainer>
          </Suspense>
        </Stage>
        
        <Grid
          position={[0, -1, 0]}
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#555555"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#888888"
          fadeDistance={25}
          fadeStrength={1}
          infiniteGrid
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
          makeDefault
        />
        
        <GizmoHelper alignment="bottom-right" margin={[80, 80]} renderPriority={2}>
          <GizmoViewport 
            axisColors={['#ff3653', '#8adb00', '#2c8fff']} 
            labelColor="white" 
            hideNegativeAxes
          />
        </GizmoHelper>
      </Canvas>
      
      <div className="absolute bottom-2 right-2 text-xs text-white/50 pointer-events-none">
        Use mouse to rotate | Scroll to zoom | Shift+drag to pan
      </div>
    </div>
  );
};

export default ModelViewer;
