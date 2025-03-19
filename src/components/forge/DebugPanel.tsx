
import React from 'react';
import { useThree } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vector3, Euler, Mesh } from 'three';

interface DebugPanelProps {
  modelRef?: React.RefObject<Mesh>;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ modelRef }) => {
  const { camera } = useThree();
  const [cameraData, setCameraData] = React.useState({
    position: new Vector3(),
    rotation: new Euler(),
  });
  const [modelData, setModelData] = React.useState({
    position: new Vector3(),
    rotation: new Euler(),
    scale: new Vector3(1, 1, 1)
  });

  // Update data on each frame
  useFrame(() => {
    setCameraData({
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
    });

    if (modelRef?.current) {
      setModelData({
        position: modelRef.current.position.clone(),
        rotation: modelRef.current.rotation.clone(),
        scale: modelRef.current.scale.clone()
      });
    }
  });

  const formatVector = (vec: Vector3) => 
    `x: ${vec.x.toFixed(2)}, y: ${vec.y.toFixed(2)}, z: ${vec.z.toFixed(2)}`;
  
  const formatEuler = (euler: Euler) => 
    `x: ${(euler.x * (180/Math.PI)).toFixed(2)}°, y: ${(euler.y * (180/Math.PI)).toFixed(2)}°, z: ${(euler.z * (180/Math.PI)).toFixed(2)}°`;

  const resetCamera = () => {
    camera.position.set(200, 100, 200);
    camera.lookAt(0, 0, 0);
  };

  return (
    <Card className="absolute right-4 bottom-4 w-80 bg-opacity-75 bg-background backdrop-blur-sm text-xs z-10">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="py-2 space-y-4">
        <div>
          <h3 className="font-bold mb-1">Camera</h3>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-muted-foreground">Position:</span>
            <span>{formatVector(cameraData.position)}</span>
            <span className="text-muted-foreground">Rotation:</span>
            <span>{formatEuler(cameraData.rotation)}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 h-7 text-xs" 
            onClick={resetCamera}
          >
            Reset Camera
          </Button>
        </div>
        
        {modelRef?.current && (
          <div>
            <h3 className="font-bold mb-1">Model</h3>
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-muted-foreground">Position:</span>
              <span>{formatVector(modelData.position)}</span>
              <span className="text-muted-foreground">Rotation:</span>
              <span>{formatEuler(modelData.rotation)}</span>
              <span className="text-muted-foreground">Scale:</span>
              <span>{formatVector(modelData.scale)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
