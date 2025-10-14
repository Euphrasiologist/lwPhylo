import fortify from "../utils/fortify.js"

/**
 * Compute per-node polar coordinates for radial layout:
 *  - Tip angles: evenly spaced 0..2π in tip DFS order
 *  - Internal angles: circular mean of child angles
 *  - Radii: cumulative branch length from root
 *  - x,y: cartesian projection
 *
 * Returns the fortified array with added {angle, r, x, y}.
 */
export default function radialData(node) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;

  const pd = fortify(node, /*sort*/ true);
  const byId = new Map(pd.map(d => [d.thisId, d]));

  // Build children list by ids (from fortified "children")
  const kids = new Map(pd.map(d => [d.thisId, d.children || []]));

  // Find root id
  let root = null;
  for (const d of pd) if (d.parentId == null) { root = d.thisId; break; }

  // Collect tip ids in DFS left->right order to preserve input ordering
  const tipIds = [];
  (function dfs(id) {
    const row = byId.get(id);
    const c = kids.get(id) || [];
    if (c.length === 0) {
      tipIds.push(id);
      return;
    }
    for (const ch of c) dfs(ch);
  })(root);

  // Assign tip angles evenly spaced 0..2π
  const N = Math.max(1, tipIds.length);
  const angle = new Map();
  tipIds.forEach((id, i) => {
    angle.set(id, (i / N) * TAU);
  });

  // Internal node angles: circular mean of child angles
  // Do a post-order traversal to ensure children are set first.
  (function setInternalAngles(id) {
    const c = kids.get(id) || [];
    for (const ch of c) setInternalAngles(ch);
    if (c.length > 0) {
      let sx = 0, sy = 0;
      for (const ch of c) {
        const th = angle.get(ch);
        sx += Math.cos(th);
        sy += Math.sin(th);
      }
      angle.set(id, norm(Math.atan2(sy, sx)));
    }
  })(root);

  // Radii: cumulative branch lengths from root (root r=0)
  const radius = new Map();
  radius.set(root, 0);
  (function setR(id) {
    const c = kids.get(id) || [];
    const r0 = radius.get(id) || 0;
    for (const ch of c) {
      const child = byId.get(ch);
      const bl = child?.branchLength ?? 0;
      radius.set(ch, r0 + bl);
      setR(ch);
    }
  })(root);

  // Enrich pd rows with angle, r, x, y
  for (const d of pd) {
    const th = angle.get(d.thisId) ?? 0;
    const r = radius.get(d.thisId) ?? 0;
    d.angle = th;
    d.r = r;
    d.x = r * Math.cos(th);
    d.y = r * Math.sin(th);
  }

  return pd;
}

