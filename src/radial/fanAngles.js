// APE-like "fan" angles: tips evenly spaced with open-angle gap & rotation,
// internal nodes = arithmetic mean of unwrapped child angles.
const TAU = Math.PI * 2;
const norm = (t) => ((t % TAU) + TAU) % TAU;

function unwrapAround(ref, a) {
  let x = a;
  while (x < ref - Math.PI) x += TAU;
  while (x > ref + Math.PI) x -= TAU;
  return x;
}

export default function fanAngles(pd, opts = {}) {
  const { openAngleDeg = 0, rotateDeg = 0 } = opts;
  const gap = (openAngleDeg / 360) * TAU;
  const rot = (rotateDeg / 360) * TAU;

  // root + children index
  let root = null;
  const kids = new Map(pd.map((d) => [d.thisId, d.children || []]));
  for (const d of pd) if (d.parentId == null) { root = d.thisId; break; }

  // tip order (DFS left→right like your fortify)
  const tipIds = [];
  (function dfs(id) {
    const c = kids.get(id) || [];
    if (!c.length) { tipIds.push(id); return; }
    for (const ch of c) dfs(ch);
  })(root);

  const N = Math.max(1, tipIds.length);
  const maxA = TAU * (1 - 1 / N) - gap;       // note: no last-step overlap
  const step = N > 1 ? maxA / (N - 1) : 0;

  const angle = new Map();
  tipIds.forEach((id, i) => angle.set(id, norm(i * step + rot)));

  // internal nodes: arithmetic mean of child angles (unwrapped)
  (function setInternal(id) {
    const c = kids.get(id) || [];
    for (const ch of c) setInternal(ch);
    if (c.length) {
      const a0 = angle.get(c[0]);
      const arr = c.map((ch) => unwrapAround(a0, angle.get(ch)));
      angle.set(id, norm(arr.reduce((s, v) => s + v, 0) / arr.length));
    }
  })(root);

  return angle;
}

