'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei';
import { StarField } from './StarField';
import { ClusterLabels } from './ClusterLabels';
import { ConstellationLines } from './ConstellationLines';
import { MeteorEffect } from './MeteorEffect';
import { CosmicDust } from './CosmicDust';
import { PostProcessing } from './PostProcessing';
import { ZoomTracker } from './ZoomTracker';
import * as THREE from 'three';

export function CosmosCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // R3F's Canvas intercepts contextmenu at canvas level.
  // Override it by capturing the event on our wrapper first.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handler = (e: MouseEvent) => {
      // Allow default browser context menu
      e.stopPropagation();
    };

    // Use capture phase to intercept before R3F
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
        <fog attach="fog" args={['#000008', 120, 450]} />

        {/* Cosmic ambient lighting */}
        <ambientLight intensity={0.08} />
        <pointLight position={[80, 60, 60]} intensity={0.4} color="#4488ff" distance={300} decay={2} />
        <pointLight position={[-60, -40, -70]} intensity={0.25} color="#ff4488" distance={250} decay={2} />
        <pointLight position={[0, 80, -40]} intensity={0.15} color="#44ffaa" distance={200} decay={2} />

        {/* Deep background star field — multiple layers */}
        <Stars
          radius={300}
          depth={150}
          count={4000}
          factor={4}
          saturation={0.3}
          fade
          speed={0.15}
        />
        <Stars
          radius={180}
          depth={80}
          count={1500}
          factor={2}
          saturation={0.1}
          fade
          speed={0.08}
        />

        {/* StarField renders bookmark stars — NO Suspense to avoid font-load hiding */}
        <StarField />

        <Suspense fallback={null}>
          <CosmicDust />
          <ConstellationLines />
          <MeteorEffect />
        </Suspense>

        {/* ClusterLabels uses font — separate Suspense to avoid hiding stars */}
        <Suspense fallback={null}>
          <ClusterLabels />
        </Suspense>

        <ZoomTracker />
        <PostProcessing />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.35}
          zoomSpeed={0.7}
          minDistance={5}
          maxDistance={200}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
