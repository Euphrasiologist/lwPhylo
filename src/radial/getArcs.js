/**
 * Build arc descriptors for each internal parent:
 *  - One arc per internal node at radius = parent.r
 *  - Start/end angles choose the *shortest* wrap-aware span covering the children
 *  - Skips degenerate spans (delta ~ 0)
 */
export default function getArcs(pd) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;
  const EPS = 1e-6;

  // Quick lookups
  const byId = new Map(pd.map(d => [d.thisId, d]));
  const childrenByParent = new Map();
  let root = null;

  for (const d of pd) {
    if (d.parentId == null) root = d.thisId;
    if (!childrenByParent.has(d.parentId)) childrenByParent.set(d.parentId, []);
    childrenByParent.get(d.parentId).push(d);
  }

  const arcs = [];

  for (const parent of pd) {
    const pid = parent.thisId;
    if (pid === root) continue; // no arc above root
    const kids = childrenByParent.get(pid) || [];
    if (kids.length < 2) continue; // need at least two children

    // Collect & sort child angles
    const A = kids.map(k => norm(k.angle)).sort((a, b) => a - b);
    const aMin = A[0], aMax = A[A.length - 1];

    // Two candidate spans: direct (aMin -> aMax) and wrapped (aMax -> aMin across 2π)
    const direct = aMax - aMin;
    const wrapped = TAU - direct;

    // Choose the shorter span. We'll draw **CCW** (sweepFlag = 0) in describeArc.
    let start, end, span;
    if (direct <= wrapped) {
      start = aMin;
      end = aMax;
      span = direct;
    } else {
      // wrapped is shorter: go CCW from aMax up through 2π to aMin
      start = aMax;
      end = aMin;
      span = wrapped;
    }

    if (span < EPS || !isFinite(parent.r) || parent.r <= 0) continue;

    arcs.push({
      start,
      end,
      radius: parent.r,
      thisId: pid,
      parentId: parent.parentId
    });
  }

  return arcs;
}

