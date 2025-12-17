/**
 * APE-like block arcs per internal parent.
 * Draw CCW from first child's angle to last child's angle (wrapping allowed).
 */
export default function getArcsFan(pd) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;

  const byId = new Map(pd.map(d => [d.thisId, d]));
  const arcs = [];

  for (const p of pd) {
    const c = p.children || [];
    if (c.length < 2 || !(p.r > 0)) continue;

    const first = byId.get(c[0])?.angle;
    const last  = byId.get(c[c.length - 1])?.angle;
    if (first == null || last == null) continue;

    const start = norm(first);
    const end   = norm(last);

    const deltaCCW = (end - start + TAU) % TAU;
    if (deltaCCW < 1e-9) continue;

    arcs.push({
      parentId: p.parentId,
      thisId: p.thisId,
      radius: p.r,
      start,
      end,
      sweep: "ccw",                 // << math sweep
      largeArc: deltaCCW > Math.PI ? 1 : 0
    });
  }

  return arcs;
}

