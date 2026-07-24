/**
 * Parse a Newick tree string into a doubly-linked list of JS Objects.
 * Assigns labels, branch lengths, and node IDs (tips before internals if input emits them that way).
 *
 * Notes / limitations:
 * - Quoted labels and NHX annotations are not fully supported.
 * - Branch lengths in scientific notation are supported (parseFloat).
 */

export default function readTree(text) {
  // Remove all whitespace (space, tabs, newlines)
  text = String(text).replace(/\s+/g, '');

  const tokens = text.split(/(;|\(|\)|,)/);
  let nodeId = 0;
  const makeNode = (parent) => ({
    parent,
    children: [],
    id: nodeId++,
    label: '',
    branchLength: null
  });

  const root = makeNode(null);
  let curnode = root;

  for (const token of tokens) {
    if (!token || token === ';') continue;

    if (token === '(') {
      const child = makeNode(curnode);
      curnode.children.push(child);
      curnode = child; // descend
    } else if (token === ',') {
      // back to parent, then create sibling
      curnode = curnode.parent;
      const child = makeNode(curnode);
      curnode.children.push(child);
      curnode = child;
    } else if (token === ')') {
      // ascend one level
      curnode = curnode.parent;
      if (curnode === null) break;
    } else {
      // label/branch-length chunk (e.g., "A:0.01" or "A")
      // Note: nodes are assigned an id at creation (above), so internal
      // (clade) nodes that carry neither a label nor a branch length —
      // e.g. "((A,B),(C,D));" — still get a valid, linkable id here.
      const nodeinfo = token.split(':');
      if (nodeinfo.length === 1) {
        if (token.startsWith(':')) {
          curnode.branchLength = parseFloat(nodeinfo[0]);
        } else {
          curnode.label = nodeinfo[0];
        }
      } else if (nodeinfo.length === 2) {
        curnode.label = nodeinfo[0];
        curnode.branchLength = parseFloat(nodeinfo[1]);
      } else {
        console.warn(token, "Unhandled token with multiple ':' characters");
        curnode.label = nodeinfo[0] || '';
        curnode.branchLength = parseFloat(nodeinfo[nodeinfo.length - 1]);
      }
    }
  }

  return root;
}

