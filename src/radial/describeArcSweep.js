// describeArcSweep.js
export default function describeArcSweep(cx, cy, r, a0, a1, sweep /*0=CCW,1=CW*/) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;
  const delta = sweep === 0 ? norm(a1 - a0) : norm(a0 - a1); // magnitude on chosen sweep
  if (delta < 1e-9 || r <= 0) return "";
  const largeArcFlag = delta > Math.PI ? 1 : 0;
  const p0 = { x: cx + r * Math.cos(a0), y: cy - r * Math.sin(a0) };
  const p1 = { x: cx + r * Math.cos(a1), y: cy - r * Math.sin(a1) };
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArcFlag} ${sweep} ${p1.x} ${p1.y}`;
}

