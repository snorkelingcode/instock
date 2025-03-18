
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, GizmoHelper, GizmoViewport } from '@react-three/drei';
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

const ModelDisplay = ({ url, customOptions }: { url: string, customOptions: Record<string, any> }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loader = new STLLoader();
    
    loader.load(
      url,
      (loadedGeometry) => {
        setGeometry(loadedGeometry);
        setLoading(false);
      },
      (xhr) => {
        // Progress callback
        console.log(`${Math.round(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      (err) => {
        // Error callback
        console.error('Error loading STL:', err);
        setError(`Failed to load model: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      // STLLoader doesn't have an abort method, but we can clean up state
      setGeometry(null);
    };
  }, [url]);
  
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
  
  // Apply customization options to the material
  const color = customOptions.color || '#ffffff';
  const scale = customOptions.scale || 1;
  
  return (
    <mesh scale={[scale, scale, scale]}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const ModelViewer: React.FC<ModelViewerProps> = ({ model, customizationOptions }) => {
  const { user } = useAuth();
  const [viewerError, setViewerError] = useState<string | null>(null);
  
  // Combine default options with user customizations
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
    <div className="w-full h-full bg-gray-800 rounded-lg">
      {viewerError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 z-10 text-sm">
          {viewerError}
        </div>
      )}
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
        onError={(error) => {
          console.error("Canvas error:", error);
          setViewerError("Error rendering 3D model");
        }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Center>
          <Suspense fallback={
            <mesh>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial color="#666666" wireframe />
            </mesh>
          }>
            <ModelDisplay 
              url={model.stl_file_path} 
              customOptions={effectiveOptions} 
            />
          </Suspense>
        </Center>
        <OrbitControls 
          enablePan={false}
          minDistance={2}
          maxDistance={10}
        />
        <GizmoHelper alignment="top-left" margin={[80, 80]}>
          <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};

export default ModelViewer;
