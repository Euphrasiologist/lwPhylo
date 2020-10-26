//import {fortify, mean} from "./utils.js"

/**
 * Simple wrapper for rectangle layout functions
 * @param {Object} node
 */

function rectangleLayout(node) {
  var data = {};

  data.horizontal_lines = get_horizontal(node);
  data.vertical_lines = get_vertical(node);

  return data;
}

/**
 * Get the vertical lines to draw.
 * @param {Object} node
 */

function get_vertical(node) {
  var data = get_horizontal(node);

  // for the current iteration of the loop find the matching parentId
  // then take the difference
  function find_pairs(current_node) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].parentId === current_node.parentId) {
        var height = Math.abs(data[i].y0 - current_node.y0);
      }
    }
    return height;
  }

  var verticals = [];
  // find root
  var root = data.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];

  for (var i = 0; i < data.length; i++) {
    if (data[i].thisId !== root) {

      verticals.push({
        'thisId': data[i].thisId,
        'x0': data[i].x0,
        'x1': data[i].x0, // x values remain constant
        'y0': data[i].y0,
        'y1': data[i].y0 + find_pairs(data[i]),
        'heights': find_pairs(data[i])
      })

    }
  }

  return verticals;
}


/**
 * Rectangle layout algorithm.
 * Attempted copy of .layout.rect() function here https://github.com/ArtPoon/ggfree/blob/master/R/tree.R
 * @param {object} node
 */

function get_horizontal(node) {
  // phylodata layout...
  var pd = fortify(node);
  // get the names of the tips
  var tips = pd.map(d => d.isTip ? d.thisLabel : null).filter(d => d != null);
  // set y to null... not needed here.
  pd.map(d => d.y = null);
  // where y corresponds to a tip, return tip number
  // make y0 and y1 equal.
  var tipID = 1;
  for (var i = 0; i < pd.length; i++) {
    if (pd[i].isTip === true) {
      pd[i].y0 = tipID;
      pd[i].y1 = tipID;
      tipID += 1;
    }
  }

  // probably incredibly inefficient for large trees.
  // gets the y values of two child branches by looping through the whole tree...
  function y_vals(child_1, child_2) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].thisId === child_1) {
        var y1 = pd[i].y0;
      }
      if (pd[i].thisId === child_2) {
        var y2 = pd[i].y0;
      }
    }
    return mean(([y1, y2])) // see utils.js
  }

  // if the node is not a tip...
  for (var i = 0; i < pd.length; i++) {
    if (pd[i].isTip === false) {
      // then y0 === y1 and is the mean of the parental nodes
      pd[i].y0 = y_vals(pd[i].children[0], pd[i].children[1]);
      pd[i].y1 = y_vals(pd[i].children[0], pd[i].children[1]);
    }
  }

  // find root
  var root = pd.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];

  // sort the data temporarily in decreasing parentId
  pd.sort((a, b) => b.thisId - a.thisId);

  // get the branchlength of the parentID
  function get_parent_branchLength(current_parentId) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].thisId === current_parentId) {
        var branchLength = pd[i].x1;
      }
    }
    return branchLength;
  }

  // last loop...
  // now get the x0 and x1 coordinates.
  for (var i = 0; i < pd.length; i++) {
    // special cases where parent is the root.
    if (pd[i].parentId === root) {
      // x0 = 0 and x1 is branch length
      pd[i].x0 = 0;
      pd[i].x1 = pd[i].branchLength;
    } else {
      // the x0 is that of the parent
      var parent_branchLength = get_parent_branchLength(pd[i].parentId);
      pd[i].x0 = parent_branchLength;
      // the x1 is the sum of parent and current branchlength
      pd[i].x1 = parent_branchLength + pd[i].branchLength;
    }
  }

  // return the original sorted data
  pd.sort((a, b) => a.thisId - b.thisId);

  // remove root?

  // finally get rid of unwanted y, x and angle properties
  return pd.map(({ y, x, angle, ...item }) => item);
}