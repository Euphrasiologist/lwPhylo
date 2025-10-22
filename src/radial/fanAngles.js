// fanAngles.js
const TAU = Math.PI * 2;
const norm = (t) => ((t % TAU) + TAU) % TAU;

// Unwrap angles around a reference so they sit within [ref-π, ref+π]
function unwrapAround(ref, a) {
  let x = a;
  while (x < ref - Math.PI) x += TAU;
  while (x > ref + Math.PI) x -= TAU;
  return x;
}

/**
 * Compute APE "fan" compatible angles:
 *  - Tips evenly spaced over [0, span] where span = 2π*(1 - 1/Ntip) - gap
 *  - Then + rotate (radians)
 *  - Internal nodes = arithmetic mean of child angles (unwrapped)
 *
 * pd: fortified nodes array (has thisId, parentId, children[])
 * opts: { openAngleDeg=0, rotateDeg=0 }
 * returns: Map(nodeId -> angle)
 */
export default function fanAngles(pd, opts = {}) {
  const { openAngleDeg = 0, rotateDeg = 0 } = opts;
  const gap = (openAngleDeg / 360) * TAU;
  const rotate = (rotateDeg / 360) * TAU;

  // Find root and collect tips in cladewise/DFS order
  let root = null;
  const kids = new Map(pd.map(d => [d.thisId, d.children || []]));
  for (const d of pd) if (d.parentId == null) { root = d.thisId; break; }

  const tipIds = [];
  (function dfs(id) {
    const c = kids.get(id) || [];
    if (!c.length) { tipIds.push(id); return; }
    for (const ch of c) dfs(ch);
  })(root);

  const N = Math.max(1, tipIds.length);
  // APE: 0 .. 2π*(1 - 1/N) - gap, length.out=N (no last step overlap)
  const maxA = TAU * (1 - 1 / N) - gap;
  const step = N > 1 ? maxA / (N - 1) : 0;

  const angle = new Map();
  tipIds.forEach((id, i) => {
    angle.set(id, norm(i * step + rotate));
  });

  // Internal nodes: arithmetic mean of child angles (unwrapped)
  (function setInternal(id) {
    const c = kids.get(id) || [];
    for (const ch of c) setInternal(ch);
    if (c.length > 0) {
      // unwrap child angles around the first child's angle
      const a0 = angle.get(c[0]);
      const unwrapped = c.map(ch => unwrapAround(a0, angle.get(ch)));
      const mean = unwrapped.reduce((s, v) => s + v, 0) / unwrapped.length;
      angle.set(id, norm(mean));
    }
  })(root);

  return angle;
}

