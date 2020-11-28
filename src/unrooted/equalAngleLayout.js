import numTips from "../utils/index.js"

/**
 * Equal-angle layout algorithm for unrooted trees.
 * Populates the nodes of a tree object with information on
 * the angles to draw branches such that they do not
 * intersect.
 */

function equalAngleLayout(node) {
    if (node.parent === null) {
      // node is root
      node.start = 0.;  // guarantees no arcs overlap 0
      node.end = 2.; // *pi
      node.angle = 0.;  // irrelevant
      node.ntips = numTips(node);
      node.x = 0;
      node.y = 0;
    }
  
    var child, arc, lastStart = node.start;
  
    for (var i = 0; i < node.children.length; i++) {
      // the child of the current node
      child = node.children[i];
      // the number of tips the child node has
      child.ntips = numTips(child);
  
      // assign proportion of arc to this child
      arc = (node.end - node.start) * child.ntips / node.ntips;
      child.start = lastStart;
      child.end = child.start + arc;
  
      // bisect the arc
      child.angle = child.start + (child.end - child.start) / 2.;
      lastStart = child.end;
  
      // map to coordinates
      child.x = node.x + child.branchLength * Math.sin(child.angle * Math.PI);
      child.y = node.y + child.branchLength * Math.cos(child.angle * Math.PI);
  
      // climb up
      equalAngleLayout(child);
    }
    // had to add this!
    return node;
  }
  
export default equalAngleLayout