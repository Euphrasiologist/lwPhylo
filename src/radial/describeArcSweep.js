// src/radial/describeArcSweep.js
// IMPORTANT: angles are in "math space" (increasing = CCW).
// Because we map y as (cy - r*sin(a)), SVG sweepFlag must be inverted:
//   math CCW -> svg sweepFlag = 1
//   math CW  -> svg sweepFlag = 0
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

  const svgSweepFlag = (mathSweep === "ccw") ? 1 : 0;

  return `M ${x0} ${y0} A ${r} ${r} 0 ${largeArcFlag} ${svgSweepFlag} ${x1} ${y1}`;
}

