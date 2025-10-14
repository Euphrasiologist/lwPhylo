/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 */

function levelorder(root) {
  const queue = [root], result = [];
  while (queue.length) {
    const curnode = queue.shift();         // <- FIFO
    result.push(curnode);
    for (const child of curnode.children) queue.push(child);
  }
  return result;
}


/**
 * Count the number of tips that descend from this node
 */

export default function(thisnode) {
  var result = 0;
  for (const node of levelorder(thisnode)) {
    if (node.children.length == 0) result++;
  }
  return (result);
}
