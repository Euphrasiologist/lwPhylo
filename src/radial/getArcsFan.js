/**
 * Build APE-like block arcs per internal parent:
 *  radius = parent.r
 *  start = first child's angle
 *  end   = last child's angle
 *  sweep = 0 (CCW) if end>=start; 1 (CW) if wrapped across 2π
 *
 * @param {Array} pd nodes with {thisId,parentId,children,angle,r}
 * @returns {Array} [{parentId,thisId,radius,start,end,sweep}]
 */
export default function getArcsFan(pd) {
  const byId = new Map(pd.map(d => [d.thisId, d]));
  const arcs = [];

  for (const p of pd) {
    const c = p.children || [];
    if (c.length < 2 || !(p.r > 0)) continue;

    const first = byId.get(c[0])?.angle;
    const last  = byId.get(c[c.length - 1])?.angle;
    if (first == null || last == null) continue;

    const start = first;
    const end = last;
    const sweep = end >= start ? 0 : 1; // CW if wrapped

    arcs.push({
      parentId: p.parentId,
      thisId: p.thisId,
      radius: p.r,
      start,
      end,
      sweep
    });
  }
  return arcs;
}

