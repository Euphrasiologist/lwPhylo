// getArcsFan.js
import polarToCartesian from "./polarToCartesian.js";

const TAU = Math.PI * 2;
const norm = (t) => ((t % TAU) + TAU) % TAU;

/**
 * Build arcs like APE's circular.plot:
 *  For each internal parent, draw a single arc at radius=parent.r
 *  going from first child's angle to last child's angle in child order.
 *  If last < first (wrap), we draw CW (decreasing) to stay on the block.
 *
 * pd: array with { thisId, parentId, r, children[], angle }
 * returns: [{ parentId, thisId, radius, start, end, sweep }] 
 *   where sweep=0 means CCW (start→end increasing),
 *         sweep=1 means CW  (start→end decreasing across wrap).
 */
export default function getArcsFan(pd) {
  const byId = new Map(pd.map(d => [d.thisId, d]));
  const arcs = [];

  for (const p of pd) {
    const c = p.children || [];
    if (c.length < 2) continue;
    const A = c.map(id => byId.get(id)?.angle).filter(a => a != null);
    if (A.length < 2 || !isFinite(p.r) || p.r <= 0) continue;

    // Children are contiguous in tip order; take first and last
    let start = A[0];
    let end = A[A.length - 1];

    // Decide direction like APE’s seq(start, end): 
    // if end >= start → CCW; else CW across wrap.
    const sweep = end >= start ? 0 : 1;

    arcs.push({
      parentId: p.parentId,
      thisId: p.thisId,
      radius: p.r,
      start, end, sweep
    });
  }
  return arcs;
}

