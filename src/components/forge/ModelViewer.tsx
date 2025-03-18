
import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuth } from '@/contexts/AuthContext';
import { ThreeDModel } from '@/types/model';

// Import refactored components
import LoadingScreen from './viewer/LoadingScreen';
import SmartModelContainer from './viewer/SmartModelContainer';
import ModelDisplay from './viewer/ModelDisplay';
import SceneSetup from './viewer/SceneSetup';

interface ModelViewerProps {
  model: ThreeDModel;
  customizationOptions: Record<string, any>;
}

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
          logarithmicDepthBuffer: true,
          preserveDrawingBuffer: true
        }}
        camera={{ 
          position: [0, 0, 10], 
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        onCreated={({ gl, scene, camera }) => {
          gl.setClearColor(new THREE.Color('#1a1a1a'));
          gl.localClippingEnabled = true;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          
          // Position camera to view the model correctly
          camera.position.set(5, 5, 5);
          camera.lookAt(0, 0, 0);
        }}
        onError={(error) => {
          console.error("Canvas error:", error);
          setViewerError("Error rendering 3D model");
        }}
      >
        <Suspense fallback={null}>
          <SceneSetup>
            <SmartModelContainer>
              <ModelDisplay 
                url={model.stl_file_path} 
                customOptions={effectiveOptions} 
              />
            </SmartModelContainer>
          </SceneSetup>
        </Suspense>
      </Canvas>
      
      <div className="absolute bottom-2 right-2 text-xs text-white/50 pointer-events-none">
        Use mouse to rotate | Scroll to zoom | Shift+drag to pan
      </div>
    </div>
  );
};

export default ModelViewer;
