// src/radial/describeArcSweep.js
const TAU = Math.PI * 2;
const norm = (t) => ((t % TAU) + TAU) % TAU;

export default function describeArcSweep(cx, cy, r, a0, a1, sweep /*0=CCW,1=CW*/) {
  console.log("describeArcSweep input:", {
    cx, cy, r,
    a0Deg: (a0 * 180 / Math.PI).toFixed(2),
    a1Deg: (a1 * 180 / Math.PI).toFixed(2),
    sweep
  });

  const delta = sweep === 0 ? norm(a1 - a0) : norm(a0 - a1);
  if (!(r > 0) || delta < 1e-9) return "";
  const largeArcFlag = delta > Math.PI ? 1 : 0;

  const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);

  return `M ${x0} ${y0} A ${r} ${r} 0 ${largeArcFlag} ${sweep} ${x1} ${y1}`;
}

