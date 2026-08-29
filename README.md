# lwPhylo

A lightweight, low level javascript library to plot phylogenies from a Newick file. It uses no dependencies on any other package, but is designed to be given to the D3 library for visualisation.

## Website

Visit https://euphrasiologist.github.io/lwPhylo/ to see examples and live rendering of trees. Can even paste your own in.

### Functionality

Newick trees can be parsed using the `readTree()` function. This object can then be wrapped in three main functions; `rectangleLayout()` to produce a "regular" phylogenetic tree, `radialLayout()` to produce a circular phylogeny, and `unrooted()` to produce an unrooted tree via the equal angle layout algorithm.

Need a tree to experiment with? `randomTree(nTips, { maxBranchLength, labelPrefix, seed })` generates a random bifurcating tree in the same node shape as `readTree()`, ready to pass straight into any of the layout functions. `toNewick(tree)` serializes one of these parsed tree objects back to a Newick string.

`ladderize(tree, { ascending })` and `rotate(tree, nodeId)` change tip order by reordering a node's children in place — ladderize sorts every clade by descendant tip count (smallest first by default), rotate flips the child order at one node (the root, if no id is given).

`drawPhylogeny(input, options)` accepts either a Newick string or an already-parsed tree object (from `readTree()`/`randomTree()`) as `input`. Passing the same parsed tree object back in across re-renders — e.g. after mutating it with `rotate()` — keeps node ids stable, which `onNodeClick` (below) relies on. Options, in addition to `layout`/`width`/`height`/`tipLabels`/`labelFontSize`/`highlightTips`:
- `tipRadius` — px radius of tip circles.
- `internalNodeCircles` (bool) + `internalNodeRadius` — draw a circle at every internal node.
- `nodeLabels` (bool) + `nodeLabelFontSize` — draw text labels (e.g. clade/support values) at internal nodes that have one.
- `scaleBar` — `true` for an auto-sized branch-length scale bar, a number for an explicit length in branch-length units, or `{ length, x, y, label }` for full control.
- `alignTipLabels` (bool, rect & radial layouts) — align tip labels to a common column/ring, with dashed guide lines back to each tip's true position.
- `onNodeClick(node, event)` — fires when an internal node circle is clicked (requires `internalNodeCircles: true`).
- `container` (DOM element or CSS selector) + `rotateOnClick` (bool) — the batteries-included version of click-to-rotate: with both set, `drawPhylogeny` mounts the SVG into `container` itself and, on every internal-node click, rotates that clade and redraws back into the same container — no manual render loop needed:
  ```js
  drawPhylogeny(newickString, { layout: "rect", container: "#tree", rotateOnClick: true });
  ```
  `rotateOnClick` auto-enables `internalNodeCircles` unless you set it explicitly. A supplied `onNodeClick` still fires too, before the rotate. Without a `container`, `rotateOnClick` throws — there'd be nowhere to put the redrawn SVG. For finer control (e.g. wrapping the SVG in your own zoom/pan `<g>`, as the demo site does), skip `container`/`rotateOnClick` and drive it yourself with `onNodeClick` + `rotate()` as shown in the demo's own source.

### Acknowledgements

Original implementation of tree layout schemes are found here: https://github.com/ArtPoon/ggfree.

### Citation

Brown, M (2020). lwPhylo: A lightweight, low level javascript library to plot phylogenies from a Newick file, version 1.1.2
