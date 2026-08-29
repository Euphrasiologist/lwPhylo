# lwPhylo

A lightweight, low level javascript library to plot phylogenies from a Newick file. It uses no dependencies on any other package, but is designed to be given to the D3 library for visualisation.

## Website

Visit https://euphrasiologist.github.io/lwPhylo/ to see examples and live rendering of trees. Can even paste your own in.

### Functionality

Newick trees can be parsed using the `readTree()` function. This object can then be wrapped in three main functions; `rectangleLayout()` to produce a "regular" phylogenetic tree, `radialLayout()` to produce a circular phylogeny, and `unrooted()` to produce an unrooted tree via the equal angle layout algorithm.

Need a tree to experiment with? `randomTree(nTips, { maxBranchLength, labelPrefix, seed })` generates a random bifurcating tree in the same node shape as `readTree()`, ready to pass straight into any of the layout functions. `toNewick(tree)` serializes one of these parsed tree objects back to a Newick string, so it can be handed to `drawPhylogeny()` (which expects Newick text): `drawPhylogeny(toNewick(randomTree(20)))`.

`ladderize(tree, { ascending })` and `rotate(tree, nodeId)` change tip order by reordering a node's children in place — ladderize sorts every clade by descendant tip count (smallest first by default), rotate flips the child order at one node (the root, if no id is given).

`drawPhylogeny(newick, options)` accepts, in addition to `layout`/`width`/`height`/`tipLabels`/`labelFontSize`/`highlightTips`:
- `tipRadius` — px radius of tip circles.
- `internalNodeCircles` (bool) + `internalNodeRadius` — draw a circle at every internal node.
- `nodeLabels` (bool) + `nodeLabelFontSize` — draw text labels (e.g. clade/support values) at internal nodes that have one.
- `scaleBar` — `true` for an auto-sized branch-length scale bar, a number for an explicit length in branch-length units, or `{ length, x, y, label }` for full control.
- `alignTipLabels` (bool, rect & radial layouts) — align tip labels to a common column/ring, with dashed guide lines back to each tip's true position.

### Acknowledgements

Original implementation of tree layout schemes are found here: https://github.com/ArtPoon/ggfree.

### Citation

Brown, M (2020). lwPhylo: A lightweight, low level javascript library to plot phylogenies from a Newick file, version 1.1.2
