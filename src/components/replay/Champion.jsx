'use client';

import { mapToWorld } from './utils';

const TEAM_COLORS = {
  100: '#3a7bd5',
  200: '#c23616',
};

export function Champion({ x, y, teamId }) {
  const { worldX, worldY, worldZ } = mapToWorld(x, y);
  const color = TEAM_COLORS[teamId] ?? '#888888';

  return (
    <mesh position={[worldX, worldY, worldZ]}>
      <sphereGeometry args={[100, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
