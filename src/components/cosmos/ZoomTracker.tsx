'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useCosmosStore } from '@/lib/cosmos-store';

export function ZoomTracker() {
  const { actions } = useCosmosStore();
  const { camera } = useThree();

  useFrame(() => {
    const dist = camera.position.length();
    actions.setZoomLevel(dist);
  });

  return null;
}
