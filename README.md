# lwPhylo

A lightweight, low level javascript library to plot phylogenies from a Newick file. It uses no dependencies on any other package, but is designed to be given to the D3 library for visualisation.

### Functionality

Newick trees can be parsed using the `readTree()` function. This object can then be wrapped in three main functions; `rectangleLayout()` to produce a "regular" phylogenetic tree, `radialLayout()` to produce a circular phylogeny, and `unrooted()` to produce an unrooted tree via the equal angle layout algorithm.

### Examples

A quick tutorial is now available to see on Observable: https://observablehq.com/@euphrasiologist/lwphylo-tutorial \
It goes over the three tree layout functions, and hopefully is all quite straightforward. 

Stay tuned for examples in the browser.

### Acknowledgements

Original implementation of tree layout schemes are found here: https://github.com/ArtPoon/ggfree.

### Citation

Brown, M (2020). lwPhylo: A lightweight, low level javascript library to plot phylogenies from a Newick file, version 1.1.2
