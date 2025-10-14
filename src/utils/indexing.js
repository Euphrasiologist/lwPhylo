/**
 * Build quick indexes for a fortified data frame.
 */
export function indexTree(df) {
  const byId = new Map(df.map(r => [r.thisId, r]));
  const children = new Map(df.map(r => [r.thisId, []]));
  let root = null;
  for (const r of df) {
    if (r.parentId == null) { root = r.thisId; continue; }
    children.get(r.parentId).push(r.thisId);
  }
  // depths (BFS)
  const depth = new Map(); if (root != null) depth.set(root, 0);
  const q = root != null ? [root] : [];
  while (q.length) {
    const u = q.shift();
    for (const v of (children.get(u) || [])) {
      depth.set(v, (depth.get(u) || 0) + 1);
      q.push(v);
    }
  }
  return { byId, children, depth, root };
}

/**
 * Compute the node->root path for highlighting (returns [tip,...,root]).
 */
export function pathToRoot(dfIndex, nodeId) {
  const { byId } = dfIndex;
  const path = [];
  let cur = nodeId;
  while (cur != null) {
    path.push(cur);
    const row = byId.get(cur);
    cur = row?.parentId ?? null;
  }
  return path;
}

/**
 * Convert a path (node ids) to parent-child edge pairs.
 */
export function edgesOnPath(pathIds) {
  const pairs = [];
  for (let i = 0; i < pathIds.length - 1; i++) {
    const child = pathIds[i], parent = pathIds[i + 1];
    pairs.push({ child, parent });
  }
  return pairs;
}

/**
 * Optional: split segments at midpoints (useful for finer-grain highlighting).
 */
export function splitEdges(segments) {
  const out = [];
  for (const s of segments) {
    const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
    out.push({ ...s, x2: mx, y2: my, half: "proximal" });
    out.push({ ...s, x1: mx, y1: my, half: "distal" });
  }
  return out;
}

