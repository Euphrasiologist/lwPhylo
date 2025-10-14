import polarToCartesian from "./polarToCartesian.js";

/**
 * Draw the shortest arc between startAngle and endAngle (radians), CCW.
 * If the CW path is shorter, swap start/end so the CCW path is still shortest.
 * Works with Y-inverted screen coords (polarToCartesian already inverts Y).
 */
export default function describeArc(cx, cy, radius, startAngle, endAngle) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;
  let a0 = norm(startAngle);
  let a1 = norm(endAngle);

  // CCW and CW spans
  const ccw = (a1 - a0 + TAU) % TAU;
  const cw = (a0 - a1 + TAU) % TAU;

  // Ensure we always take the shorter span *in CCW* by swapping if needed
  if (cw < ccw) {
    const tmp = a0; a0 = a1; a1 = tmp;
  }

  const delta = (a1 - a0 + TAU) % TAU;          // now the shorter CCW span
  if (delta < 1e-9) {
    const p = polarToCartesian(cx, cy, radius, a0);
    return `M ${p.x} ${p.y}`;                   // degenerate span → no arc
  }

  const largeArcFlag = delta > Math.PI ? 1 : 0; // should be 0 for “shortest”, but keep for safety
  const sweepFlag = 0;                          // CCW

  const p0 = polarToCartesian(cx, cy, radius, a0);
  const p1 = polarToCartesian(cx, cy, radius, a1);

  return `M ${p0.x} ${p0.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${p1.x} ${p1.y}`;
}

