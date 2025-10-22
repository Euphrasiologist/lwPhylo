// src/radial/getRadiiFromPd.js
/**
 * Build per-edge spokes using the *current* pd angles/r.
 * Output: [{ parentId, childId, x0,y0,x1,y1, isTip }]
 */
export default function getRadiiFromPd(pd) {
  const byId = new Map(pd.map(d => [d.thisId, d]));
  const root = pd.find(d => d.parentId == null)?.thisId;

  const segments = [];
  for (const d of pd) {
    if (d.thisId === root) continue;
    const parent = byId.get(d.parentId);
    if (!parent) continue;

    const theta = d.angle;
    const r0 = parent.r, r1 = d.r;

    segments.push({
      parentId: parent.thisId,
      childId: d.thisId,
      x0: r0 * Math.cos(theta),
      y0: r0 * Math.sin(theta),
      x1: r1 * Math.cos(theta),
      y1: r1 * Math.sin(theta),
      isTip: !!d.isTip
    });
  }
  return segments;
}

