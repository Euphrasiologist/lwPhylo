/**
 * Recursive function for pre-order traversal of tree
 */

export function preorder(node, list = []) {
    list.push(node);
    for (var i = 0; i < node.children.length; i++) {
        list = preorder(node.children[i], list);
    }
    return (list);
}
