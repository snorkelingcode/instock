
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useAuth } from '@/contexts/AuthContext';
import { ThreeDModel } from '@/types/model';
import { useUserCustomization } from '@/hooks/use-model';

interface ModelViewerProps {
  model: ThreeDModel;
  customizationOptions: Record<string, any>;
}

const Model = ({ url, customOptions }: { url: string, customOptions: Record<string, any> }) => {
  const gltf = useGLTF(url);
  
  // Apply customization options to the model
  // This is simplified and would depend on the actual customization options
  useEffect(() => {
    if (gltf.scene && customOptions) {
      // Example: Apply color if available
      if (customOptions.color) {
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.material.color.set(customOptions.color);
          }
        });
      }
      
      // Example: Apply scale if available
      if (customOptions.scale) {
        gltf.scene.scale.set(
          customOptions.scale, 
          customOptions.scale, 
          customOptions.scale
        );
      }
    }
  }, [gltf, customOptions]);
  
  return (
    <primitive object={gltf.scene} position={[0, 0, 0]} />
  );
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
          <Model 
            url={model.stl_file_path} 
            customOptions={effectiveOptions} 
          />
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
