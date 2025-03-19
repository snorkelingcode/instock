
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';

interface DebugPanelProps {
  modelRef?: React.RefObject<THREE.Mesh>;
}

// Create a component that doesn't rely on R3F hooks
const DebugPanel: React.FC<DebugPanelProps> = () => {
  // Since we can't use useThree/useFrame outside Canvas,
  // we'll use simplified static state for demonstration
  const [cameraData] = useState({
    position: new THREE.Vector3(0, 200, 100),
    rotation: new THREE.Euler(0, 0, 0),
  });
  
  const [modelData] = useState({
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(Math.PI * -1, Math.PI, Math.PI / 2), // -180 degrees on X, 180 degrees on Y, 90 degrees on Z
    scale: new THREE.Vector3(0.01, 0.01, 0.01)
  });

  const formatVector = (vec: THREE.Vector3) => 
    `x: ${vec.x.toFixed(2)}, y: ${vec.y.toFixed(2)}, z: ${vec.z.toFixed(2)}`;
  
  const formatEuler = (euler: THREE.Euler) => 
    `x: ${(euler.x * (180/Math.PI)).toFixed(2)}°, y: ${(euler.y * (180/Math.PI)).toFixed(2)}°, z: ${(euler.z * (180/Math.PI)).toFixed(2)}°`;

  return (
    <Card className="w-80 bg-opacity-75 bg-background backdrop-blur-sm text-xs">
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
        </div>
        
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
        
        <div className="text-xs text-amber-500 mt-2">
          Note: This is a static debug panel. For live values, please refer to browser console.
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
