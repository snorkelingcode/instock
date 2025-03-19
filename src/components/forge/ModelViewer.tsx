
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useAuth } from '@/contexts/AuthContext';
import { ThreeDModel } from '@/types/model';
import { useUserCustomization } from '@/hooks/use-model';
import { Loader2 } from 'lucide-react';
import DebugPanel from './DebugPanel';

const SceneSetup = () => {
  const { scene, camera, invalidate } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 200, 100);
    camera.lookAt(0, 0, 0);
    
    invalidate();
    
    return () => {};
  }, [scene, camera, invalidate]);
  
  return null;
};

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
        
        const boundingBox = new THREE.Box3().setFromBufferAttribute(
          loadedGeometry.attributes.position as THREE.BufferAttribute
        );
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        console.log('Model dimensions:', size);
        
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
    return null;
  }
  
  if (error || !geometry) {
    return (
      <mesh>
        <boxGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
  
  const scale = customOptions.scale || 0.01;
  
  return (
    <mesh 
      ref={modelRef}
      scale={[scale, scale, scale]}
      castShadow
      receiveShadow
      position={[0, 0, 0]}
      rotation={[0, Math.PI, Math.PI / 2]} // 0°, 180°, 90°
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

const ModelViewerContent = ({ model, effectiveOptions }: { model: ThreeDModel, effectiveOptions: Record<string, any> }) => {
  const modelRef = useRef<THREE.Mesh>(null);
  
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
        <color attach="background" args={["#1f2937"]} />
        
        <SceneSetup />
        
        <PerspectiveCamera 
          makeDefault 
          position={[0, 200, 100]} 
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
            customOptions={effectiveOptions} 
          />
        </Suspense>
        
        <gridHelper args={[1000, 100, "#888888", "#444444"]} position={[0, -50, 0]} />
        
        <axesHelper args={[100]} />
        
        <OrbitControls 
          enablePan={true}
          minDistance={50}
          maxDistance={500}
          target={[0, 0, 0]}
          makeDefault
        />
        <GizmoHelper
          alignment="bottom-right"
          margin={[80, 80]}
        >
          <GizmoViewport
            labelColor="black"
          />
        </GizmoHelper>
      </Canvas>
      
      <div className="absolute bottom-4 right-4 z-10">
        <DebugPanel />
      </div>
    </>
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
      
      <ModelViewerContent model={model} effectiveOptions={effectiveOptions} />
    </div>
  );
};

export default ModelViewer;
