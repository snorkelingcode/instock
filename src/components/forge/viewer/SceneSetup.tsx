
import React from 'react';
import { Grid, Stage, OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';

const SceneSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <color attach="background" args={['#1a1a1a']} />
      
      <Stage
        preset="rembrandt"
        intensity={1.5}
        environment="city"
        adjustCamera={false}
      >
        {children}
      </Stage>
      
      <Grid
        position={[0, -1, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#555555"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#888888"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.75}
        makeDefault
      />
      
      <GizmoHelper alignment="bottom-right" margin={[80, 80]} renderPriority={2}>
        <GizmoViewport 
          axisColors={['#ff3653', '#8adb00', '#2c8fff']} 
          labelColor="white" 
          hideNegativeAxes
        />
      </GizmoHelper>
    </>
  );
};

export default SceneSetup;
