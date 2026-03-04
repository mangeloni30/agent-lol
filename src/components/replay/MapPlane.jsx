'use client';

import { DoubleSide } from 'three';

/**
 * Map plane (Summoner's Rift). Uses a solid color so it always renders;
 * external texture can fail due to CORS or network.
 */
export function MapPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[15000, 15000]} />
      <meshStandardMaterial color="#1e4620" side={DoubleSide} />
    </mesh>
  );
}
