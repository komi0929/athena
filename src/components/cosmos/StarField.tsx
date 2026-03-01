'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '@/lib/cosmos-store';
import { Bookmark } from '@/lib/types';

/**
 * Generates a smooth radial gradient texture for the star glowing halo.
 * This ensures perfect blending without polygonal artifacts.
 */
const createGlowTexture = () => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    // Exponential falloff for realistic light clustering
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// Application-wide shared texture to minimize memory overhead
let sharedGlowTexture: THREE.CanvasTexture | null = null;
const getGlowTexture = () => {
  if (!sharedGlowTexture && typeof document !== 'undefined') {
    sharedGlowTexture = createGlowTexture();
  }
  return sharedGlowTexture;
};

/**
 * StarField renders each bookmark as a highly detailed, smooth glowing sphere.
 * Uses Additive Blending and Canvas Textures for an ethereal, high-fidelity look.
 */
export function StarField() {
  const { bookmarks, actions, timeFilter, selectedBookmark, hoveredBookmark } = useCosmosStore();

  // Filter bookmarks by time — only recompute when bookmarks or timeFilter change
  const filteredBookmarks = useMemo(() => {
    if (timeFilter >= 1) return bookmarks;
    if (bookmarks.length === 0) return [];
    const dates = bookmarks.map(b => new Date(b.created_at).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const cutoff = minDate + (maxDate - minDate) * timeFilter;
    return bookmarks.filter(b => new Date(b.created_at).getTime() <= cutoff);
  }, [bookmarks, timeFilter]);

  if (filteredBookmarks.length === 0) return null;

  return (
    <group>
      {filteredBookmarks.map((bm, i) => (
        <StarMesh
          key={bm.id}
          bookmark={bm}
          index={i}
          isSelected={selectedBookmark?.id === bm.id}
          isHovered={hoveredBookmark?.id === bm.id}
          onSelect={() => {
            actions.selectBookmark(bm);
            window.dispatchEvent(new CustomEvent('athena-star-click'));
            if (navigator.vibrate) navigator.vibrate(10);
          }}
          onHover={(hovered) => {
            actions.hoverBookmark(hovered ? bm : null);
            document.body.style.cursor = hovered ? 'pointer' : 'default';
          }}
        />
      ))}
    </group>
  );
}

// ═══ Individual Star ═══
const UNREAD_HUES = [0.05, 0.08, 0.92, 0.95, 0.85];

interface StarMeshProps {
  bookmark: Bookmark;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

function StarMesh({ bookmark, index, isSelected, isHovered, onSelect, onHover }: StarMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Star color — use HDR values (above 1.0) so ACES tone mapping still renders bright
  const color = useMemo(() => {
    if (bookmark.is_read) {
      const t = (index * 0.618) % 1;
      return new THREE.Color().setHSL(0.58 + t * 0.08, 0.7, 0.8);
    }
    const hue = UNREAD_HUES[index % UNREAD_HUES.length];
    return new THREE.Color().setHSL(hue, 0.95, 0.8);
  }, [bookmark.is_read, index]);

  // HDR color for emissive-like brightness (bloom target)
  const hdrColor = useMemo(() => color.clone().multiplyScalar(2.5), [color]);
  const glowTexture = useMemo(() => getGlowTexture(), []);

  // Scale based on interaction state
  const scale = isSelected ? 3.5 : isHovered ? 2.5 : 1.0;
  const baseRadius = bookmark.is_read ? 1.5 : 2.5;

  // Animate: gentle pulse for unread stars
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (!bookmark.is_read) {
      // Float gently
      groupRef.current.position.y = bookmark.pos_y + Math.sin(t * 0.8 + index * 1.5) * 0.4;
      groupRef.current.position.x = bookmark.pos_x + Math.sin(t * 0.5 + index * 2.0) * 0.2;
    }

    // Pulse glow
    if (glowRef.current) {
      const pulse = bookmark.is_read ? 1.0 : 0.85 + 0.25 * Math.sin(t * 2.0 + index * 3.0);
      const s = baseRadius * scale * 4.5 * pulse;
      glowRef.current.scale.set(s, s, s);
    }

    // Pulse core slightly
    if (coreRef.current && !bookmark.is_read) {
      const corePulse = 1.0 + 0.05 * Math.sin(t * 3.0 + index * 1.0);
      coreRef.current.scale.set(corePulse, corePulse, corePulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[bookmark.pos_x, bookmark.pos_y, bookmark.pos_z]}
    >
      {/* Outer Glow Halo using Sprite + Additive Blending for accumulated brightness */}
      {glowTexture && (
        <sprite ref={glowRef}>
          <spriteMaterial
            map={glowTexture}
            color={color}
            transparent
            opacity={bookmark.is_read ? 0.3 : 0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}

      {/* Core bright sphere — Smooth geometry + HDR color */}
      <mesh
        ref={coreRef}
        scale={baseRadius * scale}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={hdrColor} />
      </mesh>

      {/* Pure white hot center for the brightest unread stars */}
      {!bookmark.is_read && (
        <mesh scale={baseRadius * scale * 0.5}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={new THREE.Color(4, 4, 4)} />
        </mesh>
      )}
    </group>
  );
}


