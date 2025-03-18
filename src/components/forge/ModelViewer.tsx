
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, GizmoHelper, GizmoViewport, PerspectiveCamera } from '@react-three/drei';
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
  const modelRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loader = new STLLoader();
    
    loader.load(
      url,
      (loadedGeometry) => {
        // Center the model
        loadedGeometry.center();
        // Compute vertex normals if they don't exist
        if (!loadedGeometry.attributes.normal) {
          loadedGeometry.computeVertexNormals();
        }
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
        // Fix: Handle the unknown type properly
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load model: ${errorMessage}`);
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      // STLLoader doesn't have an abort method, but we can clean up state
      setGeometry(null);
    };
  }, [url]);
  
  // Apply material based on customization options
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
  
  // Apply customization options
  const scale = customOptions.scale || 1;
  
  return (
    <mesh 
      ref={modelRef}
      scale={[scale, scale, scale]}
      castShadow
      receiveShadow
      rotation={[0, -Math.PI/2, 0]} // Rotate -90 degrees on Y axis
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color={customOptions.color || '#ffffff'}
        metalness={customOptions.material === 'metal' ? 0.8 : 0.1}
        roughness={
          customOptions.material === 'metal' ? 0.2 : 
          customOptions.material === 'wood' ? 0.8 : 0.5
        }
      />
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
    <div className="w-full h-full bg-gray-800 rounded-lg relative">
      {viewerError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 z-10 text-sm">
          {viewerError}
        </div>
      )}
      
      <Canvas
        shadows
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        onError={(error) => {
          console.error("Canvas error:", error);
          setViewerError("Error rendering 3D model");
        }}
      >
        <color attach="background" args={['#1f2937']} />
        {/* Position camera on negative X axis and rotate it to look at the model */}
        <PerspectiveCamera 
          makeDefault 
          position={[0, 0, 1000]} 
          rotation={[0, 180, 0]} 
          fov={40} 
        />
        
        <ambientLight intensity={0.3} />
        <spotLight 
          position={[-10, 10, 0]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight 
          position={[-10, 5, -5]} 
          intensity={0.5} 
          castShadow 
        />
        
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
        
        {/* Floor for shadow casting */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.2} />
        </mesh>
        
        <OrbitControls 
          enablePan={true}
          minDistance={2}
          maxDistance={10}
        />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};

export default ModelViewer;

