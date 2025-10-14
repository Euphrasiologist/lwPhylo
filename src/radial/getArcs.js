/**
 * Build *per-edge* minor arcs for a radial tree.
 * For each non-root node (child), we draw a small arc at the *parent's* radius
 * from the parent's angle to the child's angle (minor arc ≤ π).
 *
 * Input: a "radialData" array with fields:
 *   thisId, parentId, angle (radians), r (radius at this node)
 *
 * Output: [{ parentId, childId, radius, start, end }]
 *   where start/end are angles (radians), radius is parent's r
 */

function normalize(theta) {
  const t = theta % (2 * Math.PI);
  return t < 0 ? t + 2 * Math.PI : t;
}

function minorArc(a, b) {
  // returns [start, end] representing the minor arc from a -> b
  a = normalize(a); b = normalize(b);
  let diff = b - a;
  if (diff <= -Math.PI) diff += 2 * Math.PI;
  else if (diff > Math.PI) diff -= 2 * Math.PI;
  return [a, a + diff]; // draw from a to a+diff
}

export default function getArcs(pd) {
  const byId = new Map(pd.map(d => [d.thisId, d]));
  // Find root thisId
  const root = pd.find(d => d.parentId == null)?.thisId;

  const arcs = [];
  for (const d of pd) {
    if (d.thisId === root) continue;
    const parent = byId.get(d.parentId);
    if (!parent) continue;

    // minor arc from parent.angle -> child.angle at radius parent.r
    const [start, end] = minorArc(parent.angle, d.angle);

    if (!isFinite(parent.r) || parent.r === 0 || start === end) continue;
    arcs.push({
      parentId: parent.thisId,
      childId: d.thisId,
      radius: parent.r,
      start,
      end
    });
  }
  return arcs;
}

