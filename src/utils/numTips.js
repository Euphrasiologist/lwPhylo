/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 */

function levelorder(root) {
    // aka breadth-first search
    var queue = [root],
        result = [],
        curnode;

    while (queue.length > 0) {
        curnode = queue.pop();
        result.push(curnode);
        for (const child of curnode.children) {
            queue.push(child);
        }
    }
    return (result);
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