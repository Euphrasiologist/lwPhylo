import getHorizontal from "./getHorizontal.js";

/**
 * Build per-child vertical segments for a rectangular tree:
 * For each non-root node (child), draw a vertical from (parent.x, child.y) to (parent.x, parent.y).
 * This yields exactly one vertical per edge (child->parent), making highlighting trivial.
 *
 * Returns an array of:
 *   {
 *     parentId: number,
 *     childId: number,
 *     x: number,         // x of the parent junction
 *     y0: number,        // min(child.y, parent.y)
 *     y1: number,        // max(child.y, parent.y)
 *   }
 */
export default function getChildVerticals(node) {
  const data = getHorizontal(node); // has parentId, thisId, x0,x1,y0=y1

  // Build a quick index to access parent's y by id
  const byId = new Map(data.map(d => [d.thisId, d]));

  const childVerticals = [];

  for (const d of data) {
    if (d.parentId == null) continue;
    const parent = byId.get(d.parentId);
    if (!parent) continue;

    const x = d.x0;            // child’s vertical sits at parent.x == child.x0
    const yc = d.y0;           // child y
    const yp = parent.y0;      // parent y
    const y0 = Math.min(yc, yp);
    const y1 = Math.max(yc, yp);

    childVerticals.push({
      parentId: d.parentId,
      childId: d.thisId,
      x,
      y0,
      y1
    });
  }

  return childVerticals;
}

