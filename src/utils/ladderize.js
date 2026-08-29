import numTips from "./numTips.js";

/**
 * Reorder every node's children by descendant tip count, so the tree
 * "ladders" from smallest to largest clade at each branching point
 * (or the reverse, with ascending: false). Mutates the tree in place.
 */
export default function ladderize(tree, { ascending = true } = {}) {
  const sign = ascending ? 1 : -1;

  (function sort(node) {
    if (node.children.length === 0) return;
    node.children.forEach(sort);
    node.children.sort((a, b) => sign * (numTips(a) - numTips(b)));
  })(tree);

  return tree;
}
