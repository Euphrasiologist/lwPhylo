import numTips from "../utils/numTips.js"

/**
 * Equal-angle layout for unrooted trees.
 * - Precomputes ntips in O(n) to avoid repeated subtree counts
 * - Uses angles in "π units" (0..2) to match existing API
 * - Populates x,y positions from branchLength and angle
 */

function annotateTipCounts(root) {
  (function post(n) {
    if (!n.children || n.children.length === 0) {
      n.ntips = 1; return 1;
    }
    let sum = 0;
    for (const c of n.children) sum += post(c);
    n.ntips = sum;
    return sum;
  })(root);
  return root;
}

function equalAngleLayout(node) {
  if (node.parent === null) {
    annotateTipCounts(node);
    node.start = 0.;     // guarantees no arcs overlap 0
    node.end = 2.;       // *π
    node.angle = 0.;     // irrelevant at root
    node.ntips = numTips(node); // safe (already computed), left for compatibility
    node.x = 0;
    node.y = 0;
  }

  let lastStart = node.start;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const arc = (node.end - node.start) * (child.ntips / node.ntips);

    child.start = lastStart;
    child.end = lastStart + arc;

    // bisect the arc in π-units
    child.angle = child.start + (child.end - child.start) / 2.;
    lastStart = child.end;

    // map to coordinates (convert π-units to radians by multiplying by Math.PI)
    const theta = child.angle * Math.PI;
    const bl = (child.branchLength ?? 0);
    child.x = node.x + bl * Math.sin(theta);
    child.y = node.y + bl * Math.cos(theta);

    equalAngleLayout(child);
  }

  return node;
}

export default equalAngleLayout

