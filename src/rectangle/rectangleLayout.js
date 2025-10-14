import getHorizontal from "./getHorizontal.js";
import getVertical from "./getVertical.js";
import getChildVerticals from "./getChildVerticals.js";

/**
 * Rectangle layout wrapper.
 * Returns:
 *  - data: per-node rows (x0,x1,y0=y1,...)
 *  - vertical_lines: single spanning vertical per parent (fast baseline draw)
 *  - child_vertical_lines: one vertical per edge (child->parent) for highlighting
 *  - horizontal_lines: child horizontals from parent.x -> child.x at child.y
 */
export default function rectangleLayout(node) {
  const data = getHorizontal(node); // per-node horizontally resolved
  const vertical_lines = getVertical(node); // single spanning vertical per parent
  const child_vertical_lines = getChildVerticals(node); // one vertical per child edge

  const horizontal_lines = data
    .filter(d => d.parentId != null)
    .map(d => ({
      parentId: d.parentId,
      childId: d.thisId,
      x0: d.x0, x1: d.x1,
      y: d.y0
    }));

  return { data, vertical_lines, child_vertical_lines, horizontal_lines };
}
