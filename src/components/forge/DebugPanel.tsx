
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as THREE from 'three';

interface DebugPanelProps {
  cameraPosition: THREE.Vector3;
  cameraRotation: THREE.Euler;
  modelPosition: THREE.Vector3;
  modelRotation: THREE.Euler;
  modelScale: THREE.Vector3;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  cameraPosition,
  cameraRotation,
  modelPosition,
  modelRotation,
  modelScale
}) => {
  const [displayData, setDisplayData] = useState({
    camera: {
      position: new THREE.Vector3(6.52, 472.46, 0.58),
      rotation: new THREE.Euler(-Math.PI/2, 0, -Math.PI * (179.64/180))
    },
    model: {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1)
    }
  });

  useEffect(() => {
    setDisplayData({
      camera: {
        position: cameraPosition,
        rotation: cameraRotation
      },
      model: {
        position: modelPosition,
        rotation: modelRotation,
        scale: modelScale
      }
    });
  }, [cameraPosition, cameraRotation, modelPosition, modelRotation, modelScale]);

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
            <span>{formatVector(displayData.camera.position)}</span>
            <span className="text-muted-foreground">Rotation:</span>
            <span>{formatEuler(displayData.camera.rotation)}</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-bold mb-1">Model</h3>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-muted-foreground">Position:</span>
            <span>{formatVector(displayData.model.position)}</span>
            <span className="text-muted-foreground">Rotation:</span>
            <span>{formatEuler(displayData.model.rotation)}</span>
            <span className="text-muted-foreground">Scale:</span>
            <span>{formatVector(displayData.model.scale)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
