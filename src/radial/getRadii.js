import radialData from "./radialData.js";

/**
 * Per-edge radial segments (for highlighting and drawing).
 * For each non-root node, draw a radial line from the parent radius to the child radius
 * at the CHILD'S angle.
 *
 * Output: [{ parentId, childId, x0, y0, x1, y1, isTip }]
 */
export default function getRadii(node) {
  const data = radialData(node);
  const byId = new Map(data.map(d => [d.thisId, d]));
  const root = data.find(d => d.parentId == null)?.thisId;

  const segments = [];
  for (const d of data) {
    if (d.thisId === root) continue;
    const parent = byId.get(d.parentId);
    if (!parent) continue;

    const theta = d.angle;
    const r0 = parent.r;
    const r1 = d.r;

    segments.push({
      parentId: parent.thisId,
      childId: d.thisId,
      x0: r0 * Math.cos(theta),
      y0: r0 * Math.sin(theta),
      x1: r1 * Math.cos(theta),
      y1: r1 * Math.sin(theta),
      isTip: !!d.isTip
    });
  }
  return segments;
}

