'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DUST_COUNT = 2000;

// Seeded random for deterministic particle positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function CosmicDust() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const pos = new Float32Array(DUST_COUNT * 3);

    for (let i = 0; i < DUST_COUNT; i++) {
      const r = 30 + seededRandom(i * 3) * 170;
      const theta = seededRandom(i * 3 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(i * 3 + 2) - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return geo;
  }, []);

  const glowTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(200, 220, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(150, 180, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;

    pointsRef.current.rotation.y = t * 0.003;
    pointsRef.current.rotation.x = Math.sin(t * 0.001) * 0.02;

    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.25 + 0.08 * Math.sin(t * 0.4);
  });

  return (
    <points ref={pointsRef} frustumCulled={false} geometry={geometry}>
      <pointsMaterial
        map={glowTexture}
        size={1.2}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        color="#8899cc"
      />
    </points>
  );
}
