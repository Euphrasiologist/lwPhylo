export default function getChildArcsFan(pd) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;

  // Circular midpoint that travels CCW from a -> b by half the CCW span
  function midCCW(a, b) {
    const d = (b - a + TAU) % TAU;     // CCW delta a->b in [0, 2π)
    return norm(a + d / 2);
  }

  const byId = new Map(pd.map(d => [d.thisId, d]));
  const childrenByParent = new Map(pd.map(d => [d.thisId, d.children || []]));

  const child_arcs = [];

  for (const parent of pd) {
    const kids = childrenByParent.get(parent.thisId) || [];
    if (kids.length < 2) continue;

    // Sort children by angle (normalized) around the circle
    const A = kids
      .map(id => ({ id, a: norm(byId.get(id).angle) }))
      .sort((u, v) => u.a - v.a);

    const N = A.length;
    for (let i = 0; i < N; i++) {
      const prev = A[(i - 1 + N) % N];
      const cur  = A[i];
      const next = A[(i + 1) % N];

      // “fan” wedge around the child: midpoint(prev→cur) .. midpoint(cur→next)
      const start = midCCW(prev.a, cur.a);
      const end   = midCCW(cur.a, next.a);

      child_arcs.push({
        parentId: parent.thisId,
        childId: cur.id,
        radius: parent.r,   // IMPORTANT: draw at the PARENT circle
        start,
        end,
        sweep: 1            // CCW (matches describeArcSweep usage)
      });
    }
  }

  return child_arcs;
}
