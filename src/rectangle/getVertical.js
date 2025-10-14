import getHorizontal from "./getHorizontal.js"

export default function getVertical(node) {
  const data = getHorizontal(node);

  // Group rows by parentId (children that share a parent)
  const byParent = new Map();
  for (const row of data) {
    if (row.parentId == null) continue;
    const a = byParent.get(row.parentId);
    if (a) a.push(row); else byParent.set(row.parentId, [row]);
  }

  const verticals = [];
  for (const [parentId, kids] of byParent.entries()) {
    if (!kids.length) continue;
    // Works for binary and multifurcations:
    const yvals = kids.map(d => d.y0);
    const y0 = Math.min(...yvals);
    const y1 = Math.max(...yvals);
    // All children share the same junction x (their x0)
    const x = kids[0].x0;

    verticals.push({
      parentId,
      x0: x,
      x1: x,
      y0,
      y1,
      heights: y1 - y0
    });
  }

  return verticals;
}

