import mean from "../utils/mean.js"
import fortify from "../utils/fortify.js"

/**
 * Rectangle layout algorithm.
 * Attempted copy of .layout.rect() function here https://github.com/ArtPoon/ggfree/blob/master/R/tree.R
 */

export default function(node) {
  const pd = fortify(node);

  // Fast lookup from id -> pd index
  const idIndex = new Map(pd.map((d, i) => [d.thisId, i]));

  // 1) Leaf order from the INPUT TREE (respects your child order / ladderize)
  const leafIds = [];
  (function dfs(n) {
    if (!n.children || n.children.length === 0) { leafIds.push(n.id); return; }
    n.children.forEach(dfs);
  })(node);

  // Map each leaf id to a vertical slot (1..N)
  const tipSlot = new Map(leafIds.map((id, i) => [id, i + 1]));

  // 2) Set Y for tips directly from that order; compute Y for internal nodes via postorder
  (function setY(n) {
    const i = idIndex.get(n.id);
    if (!n.children || n.children.length === 0) {
      const y = tipSlot.get(n.id);
      pd[i].y0 = y; pd[i].y1 = y;
      return y;
    }
    const ys = n.children.map(setY);
    const y = mean(ys);
    pd[i].y0 = y; pd[i].y1 = y;
    return y;
  })(node);

  // 3) Set X by accumulating branch lengths down the tree (no sorting-by-id needed)
  (function setX(n, xParent) {
    const i = idIndex.get(n.id);
    const bl = pd[i].branchLength ?? 0;
    const x0 = xParent ?? 0;
    const x1 = x0 + bl;
    pd[i].x0 = x0; pd[i].x1 = x1;
    if (n.children && n.children.length) n.children.forEach(c => setX(c, x1));
  })(node, 0);

  // Clean up and return
  return pd.map(({ y, x, angle, ...item }) => item);
}
