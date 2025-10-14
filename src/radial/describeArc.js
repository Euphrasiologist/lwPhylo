import polarToCartesian from "./polarToCartesian.js";

/**
 * Describe an SVG arc path between two angles (radians).
 * Always draws the MINOR arc (≤ π). Angles are normalized to [0, 2π).
 */
function normalize(theta) {
  const t = theta % (2 * Math.PI);
  return t < 0 ? t + 2 * Math.PI : t;
}

export default function describeArc(cx, cy, radius, startAngle, endAngle) {
  let a0 = normalize(startAngle);
  let a1 = normalize(endAngle);

  // Choose the minor arc direction
  let diff = a1 - a0;
  if (diff <= -Math.PI) diff += 2 * Math.PI;
  else if (diff > Math.PI) diff -= 2 * Math.PI;

  const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0; // for completeness (will be 0 with minor arc)
  const sweepFlag = diff >= 0 ? 1 : 0;

  const start = polarToCartesian(cx, cy, radius, a0);
  const end = polarToCartesian(cx, cy, radius, a0 + diff);

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
  ].join(" ");
}

