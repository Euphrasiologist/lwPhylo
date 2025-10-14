/**
 * Recursive function for pre-order traversal of tree (returns array)
 */
export function preorder(node, list = []) {
  list.push(node);
  for (let i = 0; i < (node.children?.length || 0); i++) {
    list = preorder(node.children[i], list);
  }
  return list;
}

/**
 * Iterative generator traversals (avoid recursion limits on large trees)
 */
export function* preorderIter(root) {
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    yield n;
    if (n.children) for (let i = n.children.length - 1; i >= 0; --i) stack.push(n.children[i]);
  }
}

export function* postorderIter(root) {
  const stack = [[root, 0]];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const [n, i] = top;
    if (!n.children || i >= n.children.length) {
      stack.pop();
      yield n;
    } else {
      top[1] = i + 1;
      stack.push([n.children[i], 0]);
    }
  }
}

