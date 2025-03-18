
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

interface ModelDisplayProps {
  url: string;
  customOptions: Record<string, any>;
}

const ModelDisplay: React.FC<ModelDisplayProps> = ({ url, customOptions }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  const modelRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loader = new STLLoader();
    
    loader.load(
      url,
      (loadedGeometry) => {
        // Center the geometry
        loadedGeometry.center();
        
        // Compute vertex normals if they don't exist
        if (!loadedGeometry.attributes.normal) {
          loadedGeometry.computeVertexNormals();
        }
        
        // Calculate bounding box for smart scaling
        const box = new THREE.Box3().setFromObject(
          new THREE.Mesh(loadedGeometry)
        );
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Set the geometry and its bounding information
        setGeometry(loadedGeometry);
        setBoundingBox(box);
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
      setBoundingBox(null);
    };
  }, [url]);
  
  const getMaterial = () => {
    const color = customOptions.color || '#ffffff';
    const material = customOptions.material || 'plastic';
    
    switch(material) {
      case 'metal':
        return {
          color: color, 
          metalness: 0.8, 
          roughness: 0.2,
        };
      case 'wood':
        return {
          color: color, 
          roughness: 0.8, 
          metalness: 0.1,
        };
      case 'plastic':
      default:
        return {
          color: color, 
          roughness: 0.5, 
          metalness: 0.1,
        };
    }
  };
  
  // Calculate smart scale based on bounding box
  const smartScale = useMemo(() => {
    if (!boundingBox) return 1;
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Get the largest dimension
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Target size we want the model to appear as (in world units)
    const targetSize = 2.5;
    
    // Calculate scale factor to achieve target size
    let scaleFactor = targetSize / maxDimension;
    
    // Apply user scale on top of smart scale
    const userScale = customOptions.scale || 1;
    
    return scaleFactor * userScale;
  }, [boundingBox, customOptions.scale]);
  
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
  
  const materialProps = getMaterial();
  
  return (
    <mesh 
      ref={modelRef}
      scale={[smartScale, smartScale, smartScale]}
      castShadow
      receiveShadow
      rotation={[0, 0, 0]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        {...materialProps}
      />
    </mesh>
  );
};

export default ModelDisplay;
