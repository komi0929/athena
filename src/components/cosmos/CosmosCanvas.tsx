'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei';
import { StarField } from './StarField';
import { ClusterLabels } from './ClusterLabels';
import { ConstellationLines } from './ConstellationLines';
import { MeteorEffect } from './MeteorEffect';
import { CosmicDust } from './CosmicDust';
import { PostProcessing } from './PostProcessing';
import { ZoomTracker } from './ZoomTracker';
import * as THREE from 'three';

// ═══ Camera controller — animates camera to cluster/star targets ═══
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CameraNavigator({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3 | null>(null);
  const animating = useRef(false);

  useEffect(() => {
    const onClusterClick = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const { center_x, center_y, center_z, radius } = detail;

      // Position camera at a distance proportional to cluster radius
      const dist = Math.max(radius * 2.5, 30);
      // Camera approaches from the current direction
      const camDir = camera.position.clone().normalize();
      targetPos.current = new THREE.Vector3(
        center_x + camDir.x * dist,
        center_y + camDir.y * dist,
        center_z + camDir.z * dist,
      );
      targetLookAt.current = new THREE.Vector3(center_x, center_y, center_z);
      animating.current = true;
    };

    const onStarClick = () => {
      // Handled by detail card; could fly camera in if needed
    };

    window.addEventListener('athena-cluster-click', onClusterClick);
    window.addEventListener('athena-star-click', onStarClick);
    return () => {
      window.removeEventListener('athena-cluster-click', onClusterClick);
      window.removeEventListener('athena-star-click', onStarClick);
    };
  }, [camera]);

  useFrame((_, delta) => {
    if (!animating.current || !targetPos.current || !targetLookAt.current) return;

    const speed = 3.0 * delta;
    camera.position.lerp(targetPos.current, speed);

    if (controlsRef.current) {
      const controls = controlsRef.current;
      const currentTarget = controls.target as THREE.Vector3;
      currentTarget.lerp(targetLookAt.current, speed);
      controls.update();
    }

    // Stop when close enough
    if (camera.position.distanceTo(targetPos.current) < 0.5) {
      animating.current = false;
    }
  });

  return null;
}

export function CosmosCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const handler = (e: MouseEvent) => { e.stopPropagation(); };
    wrapper.addEventListener('contextmenu', handler, true);
    return () => wrapper.removeEventListener('contextmenu', handler, true);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100vw', height: '100vh', background: '#000005' }}
    >
      <Canvas
        camera={{ position: [0, 0, 120], fov: 60, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
        style={{ background: '#000005' }}
      >
        <AdaptiveDpr pixelated />
        <color attach="background" args={['#000005']} />
        <fog attach="fog" args={['#000008', 200, 500]} />

        {/* Cosmic ambient lighting */}
        <ambientLight intensity={0.08} />
        <pointLight position={[80, 60, 60]} intensity={0.4} color="#4488ff" distance={300} decay={2} />
        <pointLight position={[-60, -40, -70]} intensity={0.25} color="#ff4488" distance={250} decay={2} />
        <pointLight position={[0, 80, -40]} intensity={0.15} color="#44ffaa" distance={200} decay={2} />

        {/* Deep background star field */}
        <Stars radius={300} depth={150} count={4000} factor={4} saturation={0.3} fade speed={0.15} />
        <Stars radius={180} depth={80} count={1500} factor={2} saturation={0.1} fade speed={0.08} />

        {/* Bookmark stars — outside Suspense */}
        <StarField />

        <Suspense fallback={null}>
          <CosmicDust />
          <ConstellationLines />
          <MeteorEffect />
        </Suspense>

        <Suspense fallback={null}>
          <ClusterLabels />
        </Suspense>

        <CameraNavigator controlsRef={controlsRef} />
        <ZoomTracker />
        <PostProcessing />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.35}
          zoomSpeed={0.7}
          minDistance={5}
          maxDistance={250}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
