
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as THREE from 'three';

interface DebugPanelProps {
  cameraPosition?: THREE.Vector3;
  cameraRotation?: THREE.Euler;
  modelPosition?: THREE.Vector3;
  modelRotation?: THREE.Euler;
  modelScale?: THREE.Vector3;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  cameraPosition = new THREE.Vector3(0, 200, 100),
  cameraRotation = new THREE.Euler(0, 0, 0),
  modelPosition = new THREE.Vector3(0, 0, 0),
  modelRotation = new THREE.Euler(Math.PI, Math.PI, Math.PI / 2),
  modelScale = new THREE.Vector3(0.01, 0.01, 0.01)
}) => {
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
            <span>{formatVector(cameraPosition)}</span>
            <span className="text-muted-foreground">Rotation:</span>
            <span>{formatEuler(cameraRotation)}</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-bold mb-1">Model</h3>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-muted-foreground">Position:</span>
            <span>{formatVector(modelPosition)}</span>
            <span className="text-muted-foreground">Rotation:</span>
            <span>{formatEuler(modelRotation)}</span>
            <span className="text-muted-foreground">Scale:</span>
            <span>{formatVector(modelScale)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
