import polarToCartesian from "./polarToCartesian.js";

/**
 * Draw the shortest arc between startAngle and endAngle on a circle.
 * - Angles are radians.
 * - Works with Y-inverted screen coords (our polarToCartesian already inverts Y).
 * - Automatically picks CW or CCW sweep to follow the *shorter* path.
 */
export default function describeArc(cx, cy, radius, startAngle, endAngle) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;

  const a0 = norm(startAngle);
  const a1 = norm(endAngle);

  // CCW delta (a0 -> a1), and CW delta (a0 -> a1 going the other way)
  const ccw = (a1 - a0 + TAU) % TAU;
  const cw  = (a0 - a1 + TAU) % TAU;

  // Choose the shorter sweep
  const sweepFlag = cw < ccw ? 1 : 0;         // 1 = CW, 0 = CCW (SVG spec)
  const delta = Math.min(ccw, cw);
  const largeArcFlag = delta > Math.PI ? 1 : 0;

  // If degenerate, just move to the point
  if (delta < 1e-9) {
    const p = polarToCartesian(cx, cy, radius, a0);
    return `M ${p.x} ${p.y}`;
  }

  // Use the original angles; sweepFlag picks direction
  const p0 = polarToCartesian(cx, cy, radius, a0);
  const p1 = polarToCartesian(cx, cy, radius, a1);

  return `M ${p0.x} ${p0.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${p1.x} ${p1.y}`;
}

