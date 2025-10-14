import getHorizontal from "./getHorizontal.js"
import getVertical from "./getVertical.js"
import getChildVerticals from "./getChildVerticals.js"

/**
 * Rectangle layout wrapper.
 * Returns:
 *  - data: per-node rows (x0,x1,y0=y1,...)
 *  - vertical_lines: single spanning vertical per parent (baseline draw)
 *  - child_vertical_lines: one vertical per edge (for highlighting)
 *  - horizontal_lines: per-edge child horizontals (x0->x1 at y), with labels & tip flags
 */
export default function rectangleLayout(node) {
  const data = getHorizontal(node);              // per-node
  const vertical_lines = getVertical(node);      // parent spans
  const child_vertical_lines = getChildVerticals(node); // per-edge verticals

  // IMPORTANT: include y0 & y1, and carry isTip/labels for the renderer
  const byId = new Map(data.map(d => [d.thisId, d]));
  const horizontal_lines = data
    .filter(d => d.parentId != null)
    .map(d => ({
      parentId: d.parentId,
      childId: d.thisId,
      thisId: d.thisId,
      thisLabel: d.thisLabel,
      isTip: d.isTip,
      x0: d.x0,
      x1: d.x1,
      y0: d.y0,
      y1: d.y0
    }));

  return { data, vertical_lines, child_vertical_lines, horizontal_lines };
}

