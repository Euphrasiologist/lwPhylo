/**
 * Serialize a parsed tree (the parent/children node shape produced by
 * readTree() and randomTree()) back into a Newick string.
 */

export default function toNewick(node) {
  return `${serialize(node)};`;
}

function serialize(node) {
  const label = node.label || '';
  const branch = node.branchLength == null ? '' : `:${node.branchLength}`;

  if (node.children.length === 0) {
    return `${label}${branch}`;
  }

  const children = node.children.map(serialize).join(',');
  return `(${children})${label}${branch}`;
}
