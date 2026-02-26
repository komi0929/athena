'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '@/lib/cosmos-store';
import { Bookmark } from '@/lib/types';

/**
 * StarField renders each bookmark as a visible glowing sphere (mesh-based).
 * Uses standard Three.js meshes for maximum GPU/browser compatibility.
 */
export function StarField() {
  const { bookmarks, actions, timeFilter, selectedBookmark, hoveredBookmark } = useCosmosStore();

  // Filter bookmarks by time — only recompute when bookmarks or timeFilter change
  const filteredBookmarks = useMemo(() => {
    if (timeFilter >= 1) return bookmarks;
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
  const glowRef = useRef<THREE.Mesh>(null);

  // Star color
  const color = useMemo(() => {
    if (bookmark.is_read) {
      const t = (index * 0.618) % 1;
      return new THREE.Color().setHSL(0.58 + t * 0.08, 0.5, 0.75);
    }
    const hue = UNREAD_HUES[index % UNREAD_HUES.length];
    return new THREE.Color().setHSL(hue, 0.8, 0.65);
  }, [bookmark.is_read, index]);

  // Scale based on interaction state
  const scale = isSelected ? 4.0 : isHovered ? 2.5 : 1.0;
  const baseRadius = bookmark.is_read ? 1.2 : 2.0;

  // Animate: gentle pulse for unread stars
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (!bookmark.is_read) {
      // Float gently
      groupRef.current.position.y = bookmark.pos_y + Math.sin(t * 0.8 + index * 1.5) * 0.5;
      groupRef.current.position.x = bookmark.pos_x + Math.sin(t * 0.5 + index * 2.0) * 0.3;
    }

    // Pulse glow
    if (glowRef.current) {
      const pulse = bookmark.is_read ? 1.0 : 0.8 + 0.3 * Math.sin(t * 2.0 + index * 3.0);
      const s = baseRadius * scale * 3.5 * pulse;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[bookmark.pos_x, bookmark.pos_y, bookmark.pos_z]}
    >
      {/* Core bright sphere — always visible */}
      <mesh
        scale={baseRadius * scale}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
      >
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* White hot center */}
      <mesh scale={baseRadius * scale * 0.35}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Outer glow halo */}
      <mesh ref={glowRef} scale={baseRadius * scale * 3.5}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
