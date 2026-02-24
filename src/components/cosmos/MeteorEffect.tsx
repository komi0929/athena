'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '@/lib/cosmos-store';

// ═══ METEOR TRAIL SHADER ═══
const meteorVertexShader = `
  attribute float aProgress;
  varying float vProgress;
  
  void main() {
    vProgress = aProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const meteorFragmentShader = `
  varying float vProgress;
  
  uniform vec3 uColor;
  uniform float uAlpha;

  void main() {
    // Head is bright, tail fades
    float headGlow = exp(-pow(vProgress - 1.0, 2.0) * 20.0);
    float tail = (1.0 - vProgress) * 0.6;
    float brightness = headGlow + tail;
    
    vec3 color = uColor * brightness + vec3(1.0) * headGlow * 0.5;
    float alpha = brightness * uAlpha;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface ActiveMeteor {
  id: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  progress: number;
  speed: number;
  color: THREE.Color;
}

export function MeteorEffect() {
  const { bookmarks } = useCosmosStore();
  const meteorsRef = useRef<ActiveMeteor[]>([]);
  const lastSpawnRef = useRef(0);
  const idRef = useRef(0);
  const lastInteractionRef = useRef(Date.now());

  useEffect(() => {
    const handler = () => { lastInteractionRef.current = Date.now(); };
    window.addEventListener('mousemove', handler);
    window.addEventListener('mousedown', handler);
    window.addEventListener('wheel', handler);
    window.addEventListener('touchstart', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('wheel', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, []);

  useFrame((_, delta) => {
    const now = Date.now();
    const idleMs = now - lastInteractionRef.current;

    // Spawn meteor every ~4s when idle for 5+ seconds
    if (idleMs > 5000 && now - lastSpawnRef.current > 4000 && bookmarks.length >= 2) {
      const i = Math.floor(Math.random() * bookmarks.length);
      let j = Math.floor(Math.random() * bookmarks.length);
      while (j === i) j = Math.floor(Math.random() * bookmarks.length);

      const b1 = bookmarks[i];
      const b2 = bookmarks[j];
      const colors = [
        new THREE.Color('#ffcc44'),
        new THREE.Color('#44ccff'),
        new THREE.Color('#ff66cc'),
        new THREE.Color('#44ff88'),
        new THREE.Color('#ff8844'),
      ];

      meteorsRef.current.push({
        id: idRef.current++,
        from: new THREE.Vector3(b1.pos_x, b1.pos_y, b1.pos_z),
        to: new THREE.Vector3(b2.pos_x, b2.pos_y, b2.pos_z),
        progress: 0,
        speed: 0.35 + Math.random() * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
      lastSpawnRef.current = now;
    }

    // Update meteors
    meteorsRef.current = meteorsRef.current.filter(m => {
      m.progress += delta * m.speed;
      return m.progress < 1;
    });
  });

  return (
    <group>
      {meteorsRef.current.map(m => (
        <MeteorTrailMesh key={m.id} meteor={m} />
      ))}
    </group>
  );
}

function MeteorTrailMesh({ meteor }: { meteor: ActiveMeteor }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Head position
  const headPos = useMemo(() => {
    return new THREE.Vector3().lerpVectors(meteor.from, meteor.to, meteor.progress);
  }, [meteor.from, meteor.to, meteor.progress]);

  // Fade based on lifecycle
  const alpha = meteor.progress < 0.1 ? meteor.progress * 10 :
                meteor.progress > 0.8 ? (1 - meteor.progress) * 5 : 1;

  return (
    <group>
      {/* Bright head */}
      <mesh position={headPos}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshBasicMaterial
          color={meteor.color}
          transparent
          opacity={alpha * 0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Glow halo */}
      <mesh position={headPos}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshBasicMaterial
          color={meteor.color}
          transparent
          opacity={alpha * 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Spark particles behind the head */}
      <MeteorSparks meteor={meteor} alpha={alpha} />
    </group>
  );
}

function MeteorSparks({ meteor, alpha }: { meteor: ActiveMeteor; alpha: number }) {
  const sparkCount = 6;

  const sparks = useMemo(() => {
    return Array.from({ length: sparkCount }, (_, i) => {
      // Trail positions behind the head
      const trailProgress = Math.max(0, meteor.progress - (i + 1) * 0.03);
      const pos = new THREE.Vector3().lerpVectors(meteor.from, meteor.to, trailProgress);
      // Add slight random offset for sparkle effect
      pos.x += (Math.random() - 0.5) * 0.8;
      pos.y += (Math.random() - 0.5) * 0.8;
      pos.z += (Math.random() - 0.5) * 0.8;
      const fade = 1 - (i / sparkCount);
      return { pos, fade, size: 0.1 + Math.random() * 0.15 };
    });
  }, [meteor.from, meteor.to, meteor.progress]);

  return (
    <group>
      {sparks.map((spark, i) => (
        <mesh key={i} position={spark.pos}>
          <sphereGeometry args={[spark.size, 4, 4]} />
          <meshBasicMaterial
            color={meteor.color}
            transparent
            opacity={alpha * spark.fade * 0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
