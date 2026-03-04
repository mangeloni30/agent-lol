/** Fixed Y height for champions above the map plane */
export const WORLD_Y = 5;

/**
 * Map Riot timeline coordinates (0–15000, center ~7500) to Three.js world space.
 * Plane is at y=0; champions sit at WORLD_Y above it.
 */
export function mapToWorld(x, y) {
  return {
    worldX: x - 7500,
    worldZ: y - 7500,
    worldY: WORLD_Y,
  };
}

/** Linear interpolation between a and b by t in [0, 1]. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
