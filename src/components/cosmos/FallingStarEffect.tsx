/* eslint-disable */
'use client';

/**
 * FallingStarEffect — Art-level shooting star animation.
 * 
 * When a bookmark is "trashed", the star transforms into a radiant
 * shooting star that streaks across the cosmos, leaving behind a
 * luminous trail of sparkling particles before dissolving into stardust.
 * 
 * Uses instanced rendering for performance:
 *  - A bright head with bloom-inducing HDR color
 *  - A trailing ribbon of 80+ particles with exponential fade
 *  - Scattered micro-sparks that drift and twinkle
 *  - Color shift from warm gold → cool blue → transparent
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══ Types ═══
interface FallingStarData {
  id: string;
  origin: THREE.Vector3;
  startTime: number;
}

// ═══ Constants ═══
const TRAIL_PARTICLES = 80;     // Number of trail particles
const SPARK_PARTICLES = 40;     // Number of scattered sparks
const ANIMATION_DURATION = 2.2; // seconds
const HEAD_SIZE = 3.5;
const TRAIL_SIZE = 1.8;
const SPARK_SIZE = 0.6;

// ═══ Shared glow texture ═══
let _glowTex: THREE.CanvasTexture | null = null;
function getGlowTexture() {
  if (_glowTex) return _glowTex;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.06)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c);
  _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}

// ═══ Easing functions ═══
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInQuad(t: number) {
  return t * t;
}

// ═══ Color palettes ═══
const HEAD_COLORS = [
  new THREE.Color().setHSL(0.12, 1.0, 0.95),  // warm white-gold
  new THREE.Color().setHSL(0.08, 0.9, 0.9),   // gold
  new THREE.Color().setHSL(0.55, 0.8, 0.7),   // ethereal blue
];

function lerpColor(t: number): THREE.Color {
  if (t < 0.3) {
    return HEAD_COLORS[0].clone().lerp(HEAD_COLORS[1], t / 0.3);
  } else if (t < 0.7) {
    return HEAD_COLORS[1].clone().lerp(HEAD_COLORS[2], (t - 0.3) / 0.4);
  }
  return HEAD_COLORS[2].clone().multiplyScalar(1 - (t - 0.7) / 0.3);
}

// ═══ Single Falling Star ═══
function FallingStar({ origin, startTime, onComplete }: {
  origin: THREE.Vector3;
  startTime: number;
  onComplete: () => void;
}) {
  const headRef = useRef<THREE.Sprite>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const sparkRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const completedRef = useRef(false);

  const glowTex = useMemo(() => getGlowTexture(), []);

  // Pre-compute a natural trajectory direction
  const trajectory = useMemo(() => {
    // Shoot in a slightly randomized direction — generally "down and away"
    const angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.2;
    const tilt = (Math.random() - 0.5) * 0.6;
    return new THREE.Vector3(
      Math.cos(angle) * 0.8,
      -Math.sin(angle) * 0.6 - 0.3,
      tilt
    ).normalize();
  }, []);

  // Speed curve: accelerate then coast
  const speed = useMemo(() => 35 + Math.random() * 15, []);

  // Pre-compute random spark offsets
  const sparkOffsets = useMemo(() =>
    Array.from({ length: SPARK_PARTICLES }, () => ({
      drift: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ),
      delay: Math.random() * 0.4,
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    })),
  []);

  // Temp objects for instanced mesh updates
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const elapsed = (state.clock.elapsedTime * 1000 - startTime) / 1000;
    if (elapsed < 0) return;
    const t = elapsed / ANIMATION_DURATION; // normalized [0, 1]

    if (t >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
      return;
    }
    if (t >= 1) return;

    // ═══ HEAD — the bright leading point ═══
    if (headRef.current) {
      const accel = easeOutExpo(Math.min(t * 2, 1)); // fast start
      const dist = accel * speed * t;
      const pos = origin.clone().addScaledVector(trajectory, dist);
      headRef.current.position.copy(pos);

      // Scale: grows slightly then shrinks at the end
      const headScale = HEAD_SIZE * (t < 0.15 ? 1 + t * 8 : 1) * (t > 0.6 ? 1 - easeInQuad((t - 0.6) / 0.4) : 1);
      headRef.current.scale.set(headScale, headScale, headScale);

      // Color shift
      const c = lerpColor(t);
      (headRef.current.material as THREE.SpriteMaterial).color.copy(c.multiplyScalar(3)); // HDR
      (headRef.current.material as THREE.SpriteMaterial).opacity = t > 0.7 ? 1 - easeInQuad((t - 0.7) / 0.3) : 1;
    }

    // ═══ TRAIL — ribbon of fading particles behind the head ═══
    if (trailRef.current) {
      for (let i = 0; i < TRAIL_PARTICLES; i++) {
        const trailT = i / TRAIL_PARTICLES; // 0=head, 1=oldest
        const age = Math.max(0, t - trailT * 0.35); // each particle starts slightly later

        if (age <= 0) {
          tempMatrix.makeScale(0, 0, 0);
          trailRef.current.setMatrixAt(i, tempMatrix);
          continue;
        }

        const accel = easeOutExpo(Math.min(age * 2, 1));
        const dist = accel * speed * age;
        const pos = origin.clone().addScaledVector(trajectory, dist);

        // Add slight lateral wobble for organic feel
        const wobble = Math.sin(age * 12 + i * 0.5) * 0.3 * (1 - trailT);
        const perpX = -trajectory.y;
        const perpY = trajectory.x;
        pos.x += perpX * wobble;
        pos.y += perpY * wobble;

        // Scale: decreases toward tail, fades out over time
        const fadeOut = t > 0.5 ? 1 - easeInQuad((t - 0.5) / 0.5) : 1;
        const s = TRAIL_SIZE * (1 - trailT * 0.7) * fadeOut * Math.min(age * 5, 1);
        tempMatrix.makeScale(s, s, s);
        tempMatrix.setPosition(pos);
        trailRef.current.setMatrixAt(i, tempMatrix);

        // Color: shifts from gold to blue along the tail
        const c = lerpColor(trailT * 0.8 + t * 0.2);
        trailRef.current.setColorAt(i, c.multiplyScalar(2 - trailT));
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
      if (trailRef.current.instanceColor) trailRef.current.instanceColor.needsUpdate = true;
    }

    // ═══ SPARKS — scattered micro-particles that twinkle and drift ═══
    if (sparkRef.current) {
      for (let i = 0; i < SPARK_PARTICLES; i++) {
        const spark = sparkOffsets[i];
        const sparkAge = Math.max(0, t - spark.delay);

        if (sparkAge <= 0) {
          tempMatrix.makeScale(0, 0, 0);
          sparkRef.current.setMatrixAt(i, tempMatrix);
          continue;
        }

        // Sparks emanate from positions along the trail
        const trailPos = sparkAge * 0.6;
        const accel = easeOutExpo(Math.min(trailPos * 2, 1));
        const dist = accel * speed * trailPos;
        const base = origin.clone().addScaledVector(trajectory, dist);

        // Drift outward
        const driftScale = sparkAge * spark.speed * 3;
        base.add(spark.drift.clone().multiplyScalar(driftScale));

        // Gravity-like downward pull
        base.y -= sparkAge * sparkAge * 2;

        // Twinkle: rapid pulsing opacity via scale
        const twinkle = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 15 + spark.phase);
        const fadeOut = t > 0.4 ? 1 - easeInQuad((t - 0.4) / 0.6) : 1;
        const s = SPARK_SIZE * twinkle * fadeOut * Math.min(sparkAge * 8, 1);

        tempMatrix.makeScale(s, s, s);
        tempMatrix.setPosition(base);
        sparkRef.current.setMatrixAt(i, tempMatrix);

        // Warm gold → cool white
        tempColor.setHSL(
          0.12 - sparkAge * 0.15,
          1 - sparkAge * 0.3,
          0.7 + sparkAge * 0.3
        );
        sparkRef.current.setColorAt(i, tempColor.multiplyScalar(2));
      }
      sparkRef.current.instanceMatrix.needsUpdate = true;
      if (sparkRef.current.instanceColor) sparkRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ═══ Bright Head ═══ */}
      {glowTex && (
        <sprite ref={headRef} position={origin.toArray()}>
          <spriteMaterial
            map={glowTex}
            color={new THREE.Color(4, 3.5, 2)} // HDR warm white
            transparent
            opacity={1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}

      {/* ═══ Trail Ribbon ═══ */}
      <instancedMesh
        ref={trailRef}
        args={[undefined, undefined, TRAIL_PARTICLES]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* ═══ Scattered Sparks ═══ */}
      <instancedMesh
        ref={sparkRef}
        args={[undefined, undefined, SPARK_PARTICLES]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}

// ═══ Effect Manager ═══
// Listens for 'athena-star-falling' events and spawns FallingStar instances
export function FallingStarEffect() {
  const [fallingStars, setFallingStars] = useState<FallingStarData[]>([]);
  const clockRef = useRef<THREE.Clock | null>(null);

  // Capture the three.js clock on first frame
  useFrame((state) => {
    if (!clockRef.current) clockRef.current = state.clock;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const { x, y, z, id } = detail;
      const now = clockRef.current ? clockRef.current.elapsedTime * 1000 : Date.now();

      setFallingStars(prev => [...prev, {
        id: id || `fall-${Date.now()}`,
        origin: new THREE.Vector3(x, y, z),
        startTime: now,
      }]);
    };

    window.addEventListener('athena-star-falling', handler);
    return () => window.removeEventListener('athena-star-falling', handler);
  }, []);

  const removeStar = useCallback((id: string) => {
    setFallingStars(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <group>
      {fallingStars.map(star => (
        <FallingStar
          key={star.id}
          origin={star.origin}
          startTime={star.startTime}
          onComplete={() => removeStar(star.id)}
        />
      ))}
    </group>
  );
}
