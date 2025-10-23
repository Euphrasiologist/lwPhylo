export default function getChildArcsFan(pd) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;

  // Circular midpoint that travels CCW from a -> b by half the CCW span
  function midCCW(a, b) {
    const d = (b - a + TAU) % TAU; // CCW delta in [0, 2π)
    return norm(a + d / 2);
  }

  const key = (x) => (typeof x === "string" ? +x : x);

  const byId = new Map(pd.map(d => [key(d.thisId), d]));
  const childrenByParent = new Map(
    pd.map(d => [
      key(d.thisId),
      // normalize children to numeric IDs; drop anything we can't resolve
      (d.children || [])
        .map(ch => (typeof ch === "object" ? ch.thisId : ch))
        .map(key)
        .filter(id => byId.has(id))
    ])
  );

  const child_arcs = [];

  for (const parentRaw of pd) {
    const pid = key(parentRaw.thisId);
    const kids = childrenByParent.get(pid) || [];
    if (kids.length < 2) continue;

    // Sort children by angle (normalized) around the circle
    const A = kids
      .map(id => {
        const node = byId.get(id);
        return node ? { id, a: norm(node.angle) } : null;
      })
      .filter(Boolean)
      .sort((u, v) => u.a - v.a);

    const N = A.length;
    if (N < 2) continue;

    const parent = byId.get(pid);
    const radius = parent?.r;
    if (!(radius > 0)) continue;

    for (let i = 0; i < N; i++) {
      const prev = A[(i - 1 + N) % N];
      const cur  = A[i];
      const next = A[(i + 1) % N];

      // “fan” wedge around the child: midpoint(prev→cur) .. midpoint(cur→next), CCW
      const start = midCCW(prev.a, cur.a);
      const end   = midCCW(cur.a, next.a);

      child_arcs.push({
        parentId: pid,
        childId:  cur.id,
        radius,
        start,
        end,
        sweep: 0 // CCW (consistent with describeArcSweep and your y-flip)
      });
    }
  }

  return child_arcs;
}

