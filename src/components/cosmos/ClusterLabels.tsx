/* eslint-disable */
'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { useCosmosStore } from '@/lib/cosmos-store';
import * as THREE from 'three';

// ═══ NEBULA VOLUME SHADER ═══
const nebulaVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  // Simple 3D noise
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 p = vPosition * 0.15;
    p.x += uTime * 0.02;
    p.y += sin(uTime * 0.015) * 0.5;
    
    float n = fbm(p + fbm(p + uTime * 0.01));
    
    // Edge fade based on viewing angle
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    float edge = smoothstep(0.0, 0.5, fresnel) * 0.5 + 0.5;
    
    float intensity = n * edge * uOpacity;
    vec3 color = uColor * intensity;
    
    // Add subtle color variation
    color += uColor * 0.3 * fbm(p * 2.0 + 10.0) * edge;
    
    gl_FragColor = vec4(color, intensity * 0.6);
  }
`;

export function ClusterLabels() {
  const { clusters } = useCosmosStore();

  return (
    <group>
      {clusters.map((cluster) => (
        <ClusterLabel key={cluster.id} cluster={cluster} />
      ))}
    </group>
  );
}

function ClusterLabel({ cluster }: { cluster: { id: string; label: string; center_x: number; center_y: number; center_z: number; radius: number; bookmark_ids: string[] } }) {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const nebulaRef = useRef<THREE.Mesh>(null);
  const nebulaOuterRef = useRef<THREE.Mesh>(null);

  const clusterIdx = parseInt(cluster.id.split('-')[1]) || 0;

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('athena-cluster-click', {
      detail: {
        id: cluster.id,
        center_x: cluster.center_x,
        center_y: cluster.center_y,
        center_z: cluster.center_z,
        radius: cluster.radius,
      },
    }));
  };

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(
      ['#3344aa', '#5522aa', '#aa3366', '#22aa66', '#aa6622'][clusterIdx % 5]
    )},
    uOpacity: { value: 0.04 },
  }), [clusterIdx]);

  const outerUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(
      ['#4466cc', '#7744cc', '#cc4488', '#44cc88', '#cc8844'][clusterIdx % 5]
    )},
    uOpacity: { value: 0.015 },
  }), [clusterIdx]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const camDist = state.camera.position.length();
    const t = state.clock.elapsedTime;

    uniforms.uTime.value = t;
    outerUniforms.uTime.value = t;

    // Label visibility based on distance
    const labelOpacity = THREE.MathUtils.smoothstep(camDist, 50, 100);
    if (textRef.current?.material) {
      textRef.current.material.opacity = labelOpacity * 0.8;
      textRef.current.visible = labelOpacity > 0.01;
    }

    // Nebula slow rotation
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y = t * 0.02 + clusterIdx * 1.5;
      nebulaRef.current.rotation.x = Math.sin(t * 0.01 + clusterIdx) * 0.1;
    }
    if (nebulaOuterRef.current) {
      nebulaOuterRef.current.rotation.y = -t * 0.015 + clusterIdx;
      nebulaOuterRef.current.rotation.z = Math.cos(t * 0.008) * 0.05;
    }
  });

  const glowColor = useMemo(() => {
    const colors = ['#4466cc', '#7744cc', '#cc4488', '#44cc88', '#cc8844'];
    return colors[clusterIdx % colors.length];
  }, [clusterIdx]);

  return (
    <group ref={groupRef} position={[cluster.center_x, cluster.center_y, cluster.center_z]}>
      {/* Invisible click zone — easy to click */}
      <mesh onClick={handleClick} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'default'; }}>
        <sphereGeometry args={[cluster.radius * 0.8, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* FBM-driven inner nebula cloud */}
      <mesh ref={nebulaRef}>
        <icosahedronGeometry args={[cluster.radius * 0.7, 4]} />
        <shaderMaterial
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer haze — larger, more diffuse */}
      <mesh ref={nebulaOuterRef}>
        <icosahedronGeometry args={[cluster.radius * 1.3, 3]} />
        <shaderMaterial
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          uniforms={outerUniforms}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Label text */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          ref={textRef}
          fontSize={2.8}
          color={glowColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.8}
          outlineWidth={0.06}
          outlineColor="#000005"
        >
          {cluster.label}
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </Text>
      </Billboard>
    </group>
  );
}
