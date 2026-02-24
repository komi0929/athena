'use client';

import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '@/lib/cosmos-store';

// Seeded random for deterministic values
function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ═══ VERTEX SHADER — Star Core ═══
const starVertexShader = `
  attribute float aSize;
  attribute float aRandom;
  attribute vec3 aColor;
  attribute float aIsRead;

  varying vec3 vColor;
  varying float vRandom;
  varying float vIsRead;
  varying float vDist;

  uniform float uTime;

  void main() {
    vColor = aColor;
    vRandom = aRandom;
    vIsRead = aIsRead;

    vec3 pos = position;

    // Gentle floating for unread stars
    if (aIsRead < 0.5) {
      pos.y += sin(uTime * 0.8 + aRandom * 6.28) * 0.5;
      pos.x += sin(uTime * 0.5 + aRandom * 4.0) * 0.3;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDist = -mvPosition.z;

    float baseSize = aSize;
    float scale = 300.0 / vDist;

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = baseSize * scale;
    gl_PointSize = clamp(gl_PointSize, 2.0, 64.0);
  }
`;

// ═══ FRAGMENT SHADER — Star with Diffraction Spikes ═══
const starFragmentShader = `
  varying vec3 vColor;
  varying float vRandom;
  varying float vIsRead;
  varying float vDist;

  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);

    if (d > 0.5) discard;

    // Core brightness
    float core = exp(-d * 12.0);
    
    // Inner halo
    float halo = exp(-d * 4.0) * 0.6;
    
    // Outer corona
    float corona = exp(-d * 2.0) * 0.15;

    // Diffraction spikes (4-ray cross pattern)
    float angle = atan(uv.y, uv.x);
    float spikes = 0.0;
    for (int i = 0; i < 4; i++) {
      float a = angle - float(i) * 3.14159 * 0.5 - vRandom * 0.5;
      float spike = exp(-abs(sin(a)) * 8.0 / (d + 0.05)) * d * 0.5;
      spikes += spike;
    }
    spikes *= exp(-d * 3.0);

    // Twinkle
    float twinkle = 0.85 + 0.15 * sin(uTime * (2.0 + vRandom * 3.0) + vRandom * 20.0);
    
    // Unread pulse
    float pulse = 1.0;
    if (vIsRead < 0.5) {
      pulse = 0.8 + 0.3 * sin(uTime * 2.0 + vRandom * 10.0);
    }

    // White core bleeding into star color
    vec3 coreColor = vec3(1.0, 1.0, 1.0);
    vec3 starColor = mix(coreColor, vColor, smoothstep(0.0, 0.3, d));
    
    float totalBright = (core + halo + corona + spikes) * twinkle * pulse;
    vec3 finalColor = starColor * totalBright;

    // Subtle blue-white to spikes
    finalColor += vec3(0.6, 0.7, 1.0) * spikes * 0.3;

    float alpha = clamp(totalBright, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ═══ GLOW VERTEX SHADER ═══
const glowVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aRandom;
  attribute float aIsRead;

  varying vec3 vColor;
  varying float vRandom;
  varying float vIsRead;

  uniform float uTime;

  void main() {
    vColor = aColor;
    vRandom = aRandom;
    vIsRead = aIsRead;

    vec3 pos = position;
    if (aIsRead < 0.5) {
      pos.y += sin(uTime * 0.8 + aRandom * 6.28) * 0.5;
      pos.x += sin(uTime * 0.5 + aRandom * 4.0) * 0.3;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPosition.z;

    float baseSize = aSize * (aIsRead > 0.5 ? 4.0 : 8.0);
    float pulse = aIsRead > 0.5 ? 1.0 : (0.8 + 0.4 * sin(uTime * 1.5 + aRandom * 10.0));
    
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = baseSize * pulse * 300.0 / dist;
    gl_PointSize = clamp(gl_PointSize, 4.0, 120.0);
  }
`;

// ═══ GLOW FRAGMENT SHADER ═══
const glowFragmentShader = `
  varying vec3 vColor;
  varying float vRandom;
  varying float vIsRead;

  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    
    if (d > 0.5) discard;

    float glow = exp(-d * 3.5) * 0.5;
    float breathe = 0.9 + 0.1 * sin(uTime * 0.6 + vRandom * 6.0);
    
    vec3 color = vColor * glow * breathe;
    float alpha = glow * breathe * (vIsRead > 0.5 ? 0.35 : 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

export function StarField() {
  const { bookmarks, actions, timeFilter, selectedBookmark, hoveredBookmark } = useCosmosStore();
  const coreRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Points>(null);

  const filteredBookmarks = useMemo(() => {
    return actions.getFilteredBookmarks();
  }, [actions, timeFilter, bookmarks]);

  // Build geometry programmatically
  const { coreGeometry, glowGeometry } = useMemo(() => {
    const count = filteredBookmarks.length;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const rnd = new Float32Array(count);
    const ir = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const bm = filteredBookmarks[i];
      pos[i * 3] = bm.pos_x;
      pos[i * 3 + 1] = bm.pos_y;
      pos[i * 3 + 2] = bm.pos_z;

      if (bm.is_read) {
        const t = (i * 0.618) % 1;
        const color = new THREE.Color().setHSL(0.58 + t * 0.08, 0.5, 0.75);
        col[i * 3] = color.r;
        col[i * 3 + 1] = color.g;
        col[i * 3 + 2] = color.b;
      } else {
        const hues = [0.05, 0.08, 0.92, 0.95, 0.85];
        const hue = hues[i % hues.length];
        const color = new THREE.Color().setHSL(hue, 0.8, 0.65);
        col[i * 3] = color.r;
        col[i * 3 + 1] = color.g;
        col[i * 3 + 2] = color.b;
      }

      const isHovered = hoveredBookmark?.id === bm.id;
      const isSelected = selectedBookmark?.id === bm.id;
      const interactMultiplier = isSelected ? 3.0 : isHovered ? 2.2 : 1.0;

      sz[i] = (bm.is_read ? 3.0 : 4.5) * interactMultiplier;
      rnd[i] = seeded(i * 7 + 42);
      ir[i] = bm.is_read ? 1.0 : 0.0;
    }

    // Core geometry
    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    coreGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    coreGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
    coreGeo.setAttribute('aRandom', new THREE.Float32BufferAttribute(rnd, 1));
    coreGeo.setAttribute('aIsRead', new THREE.Float32BufferAttribute(ir, 1));

    // Glow uses the same data
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    glowGeo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    glowGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
    glowGeo.setAttribute('aRandom', new THREE.Float32BufferAttribute(rnd, 1));
    glowGeo.setAttribute('aIsRead', new THREE.Float32BufferAttribute(ir, 1));

    return { coreGeometry: coreGeo, glowGeometry: glowGeo };
  }, [filteredBookmarks, hoveredBookmark?.id, selectedBookmark?.id]);

  // Shader uniforms
  const coreUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  const glowUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    coreUniforms.uTime.value = t;
    glowUniforms.uTime.value = t;
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const idx = e.index;
    if (idx !== undefined && idx < filteredBookmarks.length) {
      actions.selectBookmark(filteredBookmarks[idx]);
      window.dispatchEvent(new CustomEvent('athena-star-click'));
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }, [filteredBookmarks, actions]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const idx = e.index;
    if (idx !== undefined && idx < filteredBookmarks.length) {
      actions.hoverBookmark(filteredBookmarks[idx]);
      document.body.style.cursor = 'pointer';
    }
  }, [filteredBookmarks, actions]);

  const handlePointerOut = useCallback(() => {
    actions.hoverBookmark(null);
    document.body.style.cursor = 'default';
  }, [actions]);

  if (filteredBookmarks.length === 0) return null;

  return (
    <group>
      {/* Outer glow layer */}
      <points ref={glowRef} frustumCulled={false} geometry={glowGeometry}>
        <shaderMaterial
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Core star points — with diffraction spikes */}
      <points
        ref={coreRef}
        frustumCulled={false}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        geometry={coreGeometry}
      >
        <shaderMaterial
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Nebula particles around unread items */}
      <NebulaParticles bookmarks={filteredBookmarks} />
    </group>
  );
}

// ═══ NEBULA PARTICLES ═══
function NebulaParticles({ bookmarks }: { bookmarks: ReturnType<typeof Array<any>> }) {
  const pointsRef = useRef<THREE.Points>(null);

  const nebulaVertexShader = `
    attribute float aSize;
    attribute vec3 aColor;
    attribute float aRandom;

    varying vec3 vColor;
    varying float vRandom;

    uniform float uTime;

    void main() {
      vColor = aColor;
      vRandom = aRandom;

      vec3 pos = position;
      pos.x += sin(uTime * 0.3 + aRandom * 10.0) * 1.5;
      pos.y += cos(uTime * 0.4 + aRandom * 8.0) * 1.2;
      pos.z += sin(uTime * 0.2 + aRandom * 12.0) * 0.8;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      float dist = -mvPosition.z;

      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * 200.0 / dist;
      gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);
    }
  `;

  const nebulaFragmentShader = `
    varying vec3 vColor;
    varying float vRandom;

    uniform float uTime;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;

      float nebula = exp(-d * 2.5) * 0.4;
      float flicker = 0.7 + 0.3 * sin(uTime * 1.2 + vRandom * 20.0);
      
      vec3 color = vColor * nebula * flicker;
      float alpha = nebula * flicker * 0.5;

      gl_FragColor = vec4(color, alpha);
    }
  `;

  const { geometry, count } = useMemo(() => {
    const unread = (bookmarks as any[]).filter((b: any) => !b.is_read);
    const particlesPerNode = 8;
    const cnt = unread.length * particlesPerNode;
    const pos = new Float32Array(cnt * 3);
    const col = new Float32Array(cnt * 3);
    const sz = new Float32Array(cnt);
    const rnd = new Float32Array(cnt);

    for (let i = 0; i < unread.length; i++) {
      const bm = unread[i];
      for (let j = 0; j < particlesPerNode; j++) {
        const idx = i * particlesPerNode + j;
        pos[idx * 3] = bm.pos_x + (seeded(idx * 3 + 100) - 0.5) * 6;
        pos[idx * 3 + 1] = bm.pos_y + (seeded(idx * 3 + 101) - 0.5) * 6;
        pos[idx * 3 + 2] = bm.pos_z + (seeded(idx * 3 + 102) - 0.5) * 6;

        const hues = [0.05, 0.08, 0.92, 0.95, 0.85, 0.75];
        const h = hues[(i + j) % hues.length];
        const color = new THREE.Color().setHSL(h, 0.6, 0.45);
        col[idx * 3] = color.r;
        col[idx * 3 + 1] = color.g;
        col[idx * 3 + 2] = color.b;

        sz[idx] = 2 + seeded(idx * 5 + 200) * 4;
        rnd[idx] = seeded(idx * 7 + 300);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
    geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(rnd, 1));

    return { geometry: geo, count: cnt };
  }, [bookmarks]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false} geometry={geometry}>
      <shaderMaterial
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
