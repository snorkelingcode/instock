
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useLoader, Center, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useAuth } from '@/contexts/AuthContext';
import { ThreeDModel } from '@/types/model';
import { useUserCustomization } from '@/hooks/use-model';
import { Loader2 } from 'lucide-react';

interface ModelViewerProps {
  model: ThreeDModel;
  customizationOptions: Record<string, any>;
}

const Model = ({ url, customOptions }: { url: string, customOptions: Record<string, any> }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  try {
    // Use STLLoader directly for STL files
    const geometry = useLoader(STLLoader, url);
    
    // Apply customization options to the material
    const color = customOptions.color || '#ffffff';
    const scale = customOptions.scale || 1;
    
    useEffect(() => {
      setLoading(false);
    }, [geometry]);
    
    return (
      <mesh scale={[scale, scale, scale]}>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  } catch (err) {
    console.error("Error loading model:", err);
    setError(`Failed to load model: ${err}`);
    setLoading(false);
    return null;
  }
};

const ModelViewer: React.FC<ModelViewerProps> = ({ model, customizationOptions }) => {
  const { user } = useAuth();
  const { data: userCustomization } = useUserCustomization(model.id);
  
  // Combine default options with user customizations
  const effectiveOptions = {
    ...model.default_options,
    ...customizationOptions
  };
  
  return (
    <div className="w-full h-full bg-gray-800 rounded-lg">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Center>
          <Suspense fallback={null}>
            <Model 
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
