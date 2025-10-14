/**
 * Convert polar to Cartesian: angle in radians, 0 at +x, CCW positive.
 */
export default function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle)
  };
}
