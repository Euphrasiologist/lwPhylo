# lwPhylo

A lightweight, low level javascript library to plot phylogenies from a Newick file. It uses no dependencies on any other package, but is designed to be given to the D3 library for visualisation.

## Website

Visit https://euphrasiologist.github.io/lwPhylo/ to see examples and live rendering of trees. Can even paste your own in.

### Functionality

Newick trees can be parsed using the `readTree()` function. This object can then be wrapped in three main functions; `rectangleLayout()` to produce a "regular" phylogenetic tree, `radialLayout()` to produce a circular phylogeny, and `unrooted()` to produce an unrooted tree via the equal angle layout algorithm.

Need a tree to experiment with? `randomTree(nTips, { maxBranchLength, labelPrefix, seed })` generates a random bifurcating tree in the same node shape as `readTree()`, ready to pass straight into any of the layout functions.

### Acknowledgements

Original implementation of tree layout schemes are found here: https://github.com/ArtPoon/ggfree.

### Citation

Brown, M (2020). lwPhylo: A lightweight, low level javascript library to plot phylogenies from a Newick file, version 1.1.2
