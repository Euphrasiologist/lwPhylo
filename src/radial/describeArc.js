import polarToCartesian from "./polarToCartesian.js"

export default function describeArc(cx, cy, radius, startAngle, endAngle) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;

  let a0 = norm(startAngle);
  let a1 = norm(endAngle);

  // delta in the *clockwise* direction (increasing angle after Y inversion)
  let delta = a1 - a0;
  if (delta < 0) delta += TAU;

  const largeArcFlag = delta > Math.PI ? 1 : 0;
  const sweepFlag = 1; // CLOCKWISE sweep to match getArcs' start→end

  const start = polarToCartesian(cx, cy, radius, a0);
  const end   = polarToCartesian(cx, cy, radius, a1);

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
  ].join(" ");
}

