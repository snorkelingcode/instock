
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
  
  // Calculate a more appropriate scale value - using a base scale of 0.5 and then applying user customization
  const baseScale = 0.5;
  const userScale = customOptions.scale || 1;
  const finalScale = baseScale * userScale;
  
  return (
    <mesh 
      ref={modelRef}
      scale={[finalScale, finalScale, finalScale]}
      castShadow
      receiveShadow
      rotation={[0, -Math.PI/2, 0]}
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
        <PerspectiveCamera 
          makeDefault 
          position={[-8, 3, 2]} 
          fov={40} 
        />
        
        <ambientLight intensity={0.3} />
        <spotLight 
          position={[-10, 10, 5]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight 
          position={[-5, 8, 0]} 
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
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.2} />
        </mesh>
        
        <OrbitControls 
          enablePan={true}
          minDistance={2}
          maxDistance={20}
          target={[0, 0, 0]}
        />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};

export default ModelViewer;
