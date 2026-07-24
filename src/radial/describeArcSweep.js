// src/radial/describeArcSweep.js
// IMPORTANT: angles are in "math space" (increasing = CCW).
// Because we map y as (cy - r*sin(a)), our math angle t maps to SVG angle -t.
// Increasing t (math CCW) = decreasing SVG angle = sweepFlag 0 (negative direction).
//   math CCW -> svg sweepFlag = 0
//   math CW  -> svg sweepFlag = 1
export default function describeArcSweep(
  cx, cy, r,
  a0, a1,
  mathSweep = "ccw",          // "ccw" | "cw"
  largeArcFlag = 0
) {
  if (!(r > 0)) return "";

  const x0 = cx + r * Math.cos(a0);
  const y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy - r * Math.sin(a1);

  const svgSweepFlag = (mathSweep === "ccw") ? 0 : 1;

  return `M ${x0} ${y0} A ${r} ${r} 0 ${largeArcFlag} ${svgSweepFlag} ${x1} ${y1}`;
}

