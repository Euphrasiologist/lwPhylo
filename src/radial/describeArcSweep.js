// src/radial/describeArcSweep.js
export default function describeArcSweep(cx, cy, r, a0, a1, sweep = 1, largeArcFlag = 0) {
  console.log("describeArcSweep input:", {
    cx, cy, r,
    a0Deg: (a0 * 180 / Math.PI).toFixed(2),
    a1Deg: (a1 * 180 / Math.PI).toFixed(2),
    sweep,
    largeArcFlag
  });

  if (!(r > 0)) return "";

  const x0 = cx + r * Math.cos(a0);
  const y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy - r * Math.sin(a1);

  return `M ${x0} ${y0} A ${r} ${r} 0 ${largeArcFlag} ${sweep} ${x1} ${y1}`;
}

