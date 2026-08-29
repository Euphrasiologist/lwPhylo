import { preorder } from "./preorder.js";

/**
 * Reverse the child order at one node, flipping which side of the tree
 * that clade's descendants are drawn on. Defaults to the root. Mutates
 * the tree in place.
 */
export default function rotate(tree, nodeId = tree.id) {
  const target = preorder(tree).find((n) => n.id === nodeId);
  if (!target) {
    throw new Error(`No node with id ${nodeId} found in tree`);
  }
  target.children.reverse();
  return tree;
}
