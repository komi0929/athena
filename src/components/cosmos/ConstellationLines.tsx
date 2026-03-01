/* eslint-disable */
'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '@/lib/cosmos-store';

// ═══ LINE VERTEX SHADER — Gradient + dash animation ═══
const lineVertexShader = `
  attribute float aProgress;
  varying float vProgress;
  varying vec3 vWorldPos;
  
  void main() {
    vProgress = aProgress;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const lineFragmentShader = `
  varying float vProgress;
  varying vec3 vWorldPos;
  
  uniform float uTime;
  uniform float uFadeIn;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    // Gradient along line
    vec3 color = mix(uColorA, uColorB, vProgress);
    
    // Animated dash pattern
    float dash = sin(vProgress * 30.0 - uTime * 3.0) * 0.5 + 0.5;
    dash = smoothstep(0.3, 0.7, dash);
    
    // Light pulse traveling along the line
    float pulse = exp(-pow((vProgress - fract(uTime * 0.5)) * 8.0, 2.0)) * 2.0;
    
    // Edge glow
    float glow = 0.3 + pulse;
    
    float alpha = (dash * 0.4 + glow * 0.6) * uFadeIn;
    vec3 finalColor = color + vec3(0.3, 0.5, 1.0) * pulse * 0.5;
    
    gl_FragColor = vec4(finalColor, alpha * 0.7);
  }
`;

export function ConstellationLines() {
  const { selectedBookmark, hoveredBookmark, actions } = useCosmosStore();
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const activeBookmark = selectedBookmark || hoveredBookmark;

  const lines = useMemo(() => {
    if (!activeBookmark) return [];
    const similar = actions.getSimilarBookmarks(activeBookmark);
    return similar.map(s => ({
      id: s.id,
      from: new THREE.Vector3(activeBookmark.pos_x, activeBookmark.pos_y, activeBookmark.pos_z),
      to: new THREE.Vector3(s.pos_x, s.pos_y, s.pos_z),
    }));
  }, [activeBookmark, actions]);

  useEffect(() => {
    timeRef.current = 0;
  }, [activeBookmark?.id]);

  if (!activeBookmark || lines.length === 0) return null;

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <ShaderConstellationLine
          key={line.id}
          from={line.from}
          to={line.to}
          delay={i * 0.15}
          index={i}
        />
      ))}
    </group>
  );
}

function ShaderConstellationLine({
  from,
  to,
  delay,
  index,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  delay: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const fadeRef = useRef(0);

  const { geometry, uniforms } = useMemo(() => {
    const segments = 32;
    const positions: number[] = [];
    const progressArr: number[] = [];
    const indices: number[] = [];

    // Create curved path with slight arc
    const direction = new THREE.Vector3().subVectors(to, from);
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const perpendicular = new THREE.Vector3(-direction.y, direction.x, direction.z * 0.5).normalize();
    mid.add(perpendicular.multiplyScalar(direction.length() * 0.1));

    const width = 0.15;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Quadratic Bezier
      const p = new THREE.Vector3();
      p.x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * mid.x + t * t * to.x;
      p.y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * mid.y + t * t * to.y;
      p.z = (1 - t) * (1 - t) * from.z + 2 * (1 - t) * t * mid.z + t * t * to.z;

      // Simple offset for width
      positions.push(p.x - width * 0.5, p.y, p.z);
      positions.push(p.x + width * 0.5, p.y, p.z);
      progressArr.push(t, t);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aProgress', new THREE.Float32BufferAttribute(progressArr, 1));
    geo.setIndex(indices);

    const colorPairs = [
      [new THREE.Color('#4488ff'), new THREE.Color('#aa44ff')],
      [new THREE.Color('#44ddff'), new THREE.Color('#4488ff')],
      [new THREE.Color('#ff66aa'), new THREE.Color('#aa44ff')],
      [new THREE.Color('#44ffaa'), new THREE.Color('#44ddff')],
    ];
    const pair = colorPairs[index % colorPairs.length];

    const u = {
      uTime: { value: 0 },
      uFadeIn: { value: 0 },
      uColorA: { value: pair[0] },
      uColorB: { value: pair[1] },
    };

    return { geometry: geo, uniforms: u };
  }, [from, to, index]);

  useFrame((state, delta) => {
    fadeRef.current += delta;
    const progress = Math.min(Math.max((fadeRef.current - delay) * 2.0, 0), 1);
    uniforms.uFadeIn.value = progress;
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={lineVertexShader}
        fragmentShader={lineFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
