/**
 * Generate a random bifurcating tree with `nTips` tips, in the same
 * parent/children node shape produced by readTree().
 *
 * Topology is grown by repeatedly picking a random extant lineage to split
 * (a Yule/coalescent-style process), so internal branching order is random
 * rather than a fixed balanced/caterpillar shape. Branch lengths are drawn
 * uniformly from [0, maxBranchLength).
 */

export default function randomTree(nTips = 10, {
  maxBranchLength = 1,
  labelPrefix = 't',
  seed = null
} = {}) {
  if (!Number.isInteger(nTips) || nTips < 1) {
    throw new Error("nTips must be a positive integer");
  }

  const random = seed == null ? Math.random : mulberry32(seed);

  let nodeId = 0;
  const makeNode = (parent) => ({
    parent,
    children: [],
    id: nodeId++,
    label: '',
    branchLength: null
  });

  const root = makeNode(null);

  if (nTips === 1) {
    root.label = `${labelPrefix}1`;
    return root;
  }

  // start with two lineages hanging off the root
  let lineages = [makeNode(root), makeNode(root)];
  root.children.push(...lineages);

  // repeatedly split a random lineage until we have nTips of them
  while (lineages.length < nTips) {
    const i = Math.floor(random() * lineages.length);
    const parent = lineages[i];
    const left = makeNode(parent);
    const right = makeNode(parent);
    parent.children.push(left, right);
    lineages.splice(i, 1, left, right);
  }

  // assign branch lengths to every non-root node, and tip labels in
  // left-to-right order
  let tipIndex = 0;
  const assign = (node) => {
    for (const child of node.children) {
      child.branchLength = random() * maxBranchLength;
      assign(child);
    }
    if (node.children.length === 0) {
      node.label = `${labelPrefix}${++tipIndex}`;
    }
  };
  assign(root);

  return root;
}

// small deterministic PRNG so `seed` gives reproducible trees
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
