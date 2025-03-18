
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Center, 
  GizmoHelper, 
  GizmoViewport, 
  PerspectiveCamera,
  Environment,
  Grid,
  Stage,
  useProgress
} from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useAuth } from '@/contexts/AuthContext';
import { ThreeDModel } from '@/types/model';
import { useUserCustomization } from '@/hooks/use-model';
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

const ModelDisplay = ({ url, customOptions }: { url: string, customOptions: Record<string, any> }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loader = new STLLoader();
    
    loader.load(
      url,
      (loadedGeometry) => {
        loadedGeometry.center();
        if (!loadedGeometry.attributes.normal) {
          loadedGeometry.computeVertexNormals();
        }
        setGeometry(loadedGeometry);
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
    };
  }, [url]);
  
  const getMaterial = () => {
    const color = customOptions.color || '#ffffff';
    const material = customOptions.material || 'plastic';
    
    switch(material) {
      case 'metal':
        return {
          color, 
          metalness: 0.8, 
          roughness: 0.2,
        };
      case 'wood':
        return {
          color, 
          roughness: 0.8, 
          metalness: 0.1,
        };
      case 'plastic':
      default:
        return {
          color, 
          roughness: 0.5, 
          metalness: 0.1,
        };
    }
  };
  
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
  
  // Calculate a more appropriate scale value - using a base scale of 0.2 (smaller than before)
  const baseScale = 0.2;
  const userScale = customOptions.scale || 1;
  const finalScale = baseScale * userScale;
  
  return (
    <mesh 
      ref={modelRef}
      scale={[finalScale, finalScale, finalScale]}
      castShadow
      receiveShadow
      rotation={[0, 0, 0]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial {...getMaterial()} />
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
        camera={{ position: [-8, 3, 2], fov: 40 }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          // Replace deprecated outputEncoding with outputColorSpace
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
            <ModelDisplay 
              url={model.stl_file_path} 
              customOptions={effectiveOptions} 
            />
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
          minDistance={3}
          maxDistance={20}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
          target={[0, 0, 0]}
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
