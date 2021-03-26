// https://github.com/Euphrasiologist/lwPhylo#readme v1.1.4 Copyright 2021 Max Brown
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) :
(global = global || self, factory(global.lwphylo = global.lwphylo || {}));
}(this, (function (exports) { 'use strict';

// based on https://github.com/d3/d3-plugins/blob/master/fisheye/fisheye.js
// now archived d3 code?

const phisheye = {
    circular: () => {
        var radius = 200,
            distortion = 2,
            k0,
            k1,
            focus = [0, 0],
            scales = {};

        function fisheye(d) {
            var dx = scales.xscale(d.x) - focus[0],
                dy = scales.yscale(d.y) - focus[1],
                dd = Math.sqrt(dx * dx + dy * dy);
            if (!dd || dd >= radius)
                return {
                    x: scales.xscale(d.x),
                    y: scales.yscale(d.y),
                    z: dd >= radius ? 1 : 10
                };
            var k = ((k0 * (1 - Math.exp(-dd * k1))) / dd) * .75 + .25;
            return {
                x: focus[0] + dx * k,
                y: focus[1] + dy * k,
                z: Math.min(k, 10)
            };
        }

        function rescale() {
            k0 = Math.exp(distortion);
            k0 = (k0 / (k0 - 1)) * radius;
            k1 = distortion / radius;
            return fisheye;
        }

        fisheye.radius = function (_) {
            if (!arguments.length) return radius;
            radius = +_;
            return rescale();
        };

        fisheye.distortion = function (_) {
            if (!arguments.length) return distortion;
            distortion = +_;
            return rescale();
        };

        fisheye.focus = function (_) {
            if (!arguments.length) return focus;
            focus = _;
            return fisheye;
        };

        fisheye.scales = function (_, __) {
            if (!arguments.length) return scales;
            scales = {
                xscale: _,
                yscale: __
            };
            return fisheye;
        };

        return rescale();
    }
};

/**
 * Convert polar co-ordinates to cartesian
 * https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
 */

function polarToCartesian (centerX, centerY, radius, angleInRadians) {
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

/**
 * Describe the arc to draw
 * https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
 */

function describeArc (x, y, radius, startAngle, endAngle) {

  var start = polarToCartesian(x, y, radius, startAngle);
  var end = polarToCartesian(x, y, radius, endAngle);

  // TODO: refers to middle zero below... but no large arcs needed..?
  // var largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  var d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, 0, 0, end.x, end.y
  ].join(" ");

  return d;
}

/**
 * Recursive function for pre-order traversal of tree
 */

function preorder(node, list = []) {
    list.push(node);
    for (var i = 0; i < node.children.length; i++) {
        list = preorder(node.children[i], list);
    }
    return (list);
}

/**
 * Convert parsed Newick tree from readTree() into data
 * frame.
 * this is akin to a "phylo" object in R.
 */

function fortify (tree, sort = true) {
    var df = [];

    for (const node of preorder(tree)) {
        if (node.parent === null) {
            df.push({
                'parentId': null,
                'parentLabel': null,
                'thisId': node.id,
                'thisLabel': node.label,
                'children': node.children.map(x => x.id),
                'branchLength': 0.,
                'isTip': false,
                'x': node.x,
                'y': node.y,
                'angle': node.angle
            });
        }
        else {
            df.push({
                'parentId': node.parent.id,
                'parentLabel': node.parent.label,
                'thisId': node.id,
                'thisLabel': node.label,
                'children': node.children.map(x => x.id),
                'branchLength': node.branchLength,
                'isTip': (node.children.length == 0),
                'x': node.x,
                'y': node.y,
                'angle': node.angle
            });
        }
    }

    if (sort) {
        df = df.sort(function (a, b) {
            return a.thisId - b.thisId;
        });
    }
    return (df);
}

/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 */

function levelorder(root) {
    // aka breadth-first search
    var queue = [root],
        result = [],
        curnode;

    while (queue.length > 0) {
        curnode = queue.pop();
        result.push(curnode);
        for (const child of curnode.children) {
            queue.push(child);
        }
    }
    return (result);
}

/**
 * Count the number of tips that descend from this node
 */

function numTips (thisnode) {
    var result = 0;
    for (const node of levelorder(thisnode)) {
        if (node.children.length == 0) result++;
    }
    return (result);
}

/**
 * Iterable mean
 * Poached from https://github.com/d3/d3-array/blob/master/src/mean.js
 * (Other array means buggered up the tree)
 */

function mean (values, valueof) {
    let count = 0;
    let sum = 0;
    if (valueof === undefined) {
        for (let value of values) {
            if (value != null && (value = +value) >= value) {
                ++count, sum += value;
            }
        }
    } else {
        let index = -1;
        for (let value of values) {
            if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
                ++count, sum += value;
            }
        }
    }
    if (count) return sum / count;
}

/**
 * Take a parsed tree and get the important data from them (i.e. radii, arcs).
 */

function radialData (node) {
  // should start out the same as get_horizontal
  // it's very similar in fact, but keeping separate for clarity.
  var pd = fortify(node);

  var tip_number = numTips(node);

  // make tip angles
  var tipID = 1;
  for (let i = 0; i < pd.length; i++) {
    if (pd[i].isTip == true) {
      pd[i].angle = (tipID / tip_number) * 2 * Math.PI;
      tipID += 1;
    }
  }

  // probably incredibly inefficient for large trees.
  // gets the y values of two child branches by looping through the whole tree...
  function internalNodeAngle(child_1, child_2) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].thisId === child_1) {
        var angle_1 = pd[i].angle;
      }
      if (pd[i].thisId === child_2) {
        var angle_2 = pd[i].angle;
      }
    }
    return mean([angle_1, angle_2]); // see utils.js
  }

  // if the node is not a tip...
  for (let i = 0; i < pd.length; i++) {
    if (pd[i].isTip === false) {
      // then y0 === y1 and is the mean of the parental nodes
      pd[i].angle = internalNodeAngle(pd[i].children[0], pd[i].children[1]);
    }
  }

  // find root
  var root = pd.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];

  // sort the data temporarily in decreasing parentId
  pd.sort((a, b) => b.thisId - a.thisId);

  // get the branchlength of the parentID
  function getParentBranchLength(current_parentId) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].thisId === current_parentId) {
        var branchLength = pd[i].r;
      }
    }
    return branchLength;
  }

  // assign depths (branch lengths) to radii
  for (let i = 0; i < pd.length; i++) {
    // special cases where parent is the root.
    if (pd[i].parentId === root) {

      if (pd[i].isTip === true) {
        // radius is branch length at root?
        pd[i].r = pd[i].branchLength;
        pd[i].x = pd[i].branchLength;
        pd[i].y = 0;

      } else { // it's a node
        // radius is branch length at root?
        pd[i].r = pd[i].branchLength;
        pd[i].x = pd[i].branchLength * Math.cos(pd[i].angle);
        pd[i].y = pd[i].branchLength * Math.sin(pd[i].angle);
      }

    } else {
      // the x0 is that of the parent
      var parent_branchLength = getParentBranchLength(pd[i].parentId);
      // the x1 is the sum of parent and current branchlength
      pd[i].r = parent_branchLength + pd[i].branchLength;
      // at the same time we can make x and y from polar coordinates
      // this is creating some NaN's, may cause problems later.
      pd[i].x = (parent_branchLength + pd[i].branchLength) * Math.cos(pd[i].angle);
      pd[i].y = (parent_branchLength + pd[i].branchLength) * Math.sin(pd[i].angle);
    }
  }

  // at this point the first element is the root
  pd[0].r = 0;
  pd[0].x = 0;
  pd[0].y = 0;

  // return the original sorted data
  //pd.sort((a,b) => a.thisId - b.thisId)

  return pd;
}

/**
 * Take a parsed tree and get the radii of each of the nodes.
 */

function getRadii (node) {
  var data = radialData(node);

  // for the current iteration of the loop find the matching parentId
  function getRadius(current_node) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].thisId === current_node.parentId) {
        var radius = data[i].r;
      }
    }
    return radius;
  }

  var arcs = [];
  // find root
  var root = data.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];

  for (var i = 0; i < data.length; i++) {
    if (data[i].thisId !== root) {

      arcs.push({
        'thisId': data[i].thisId,
        'thisLabel': data[i].thisLabel,
        'x0': data[i].x,
        // radius of the parent * cos(angle)
        'x1': getRadius(data[i]) * Math.cos(data[i].angle),
        'y0': data[i].y,
        // radius of the parent * sin(angle)
        'y1': getRadius(data[i]) * Math.sin(data[i].angle),
        'isTip': data[i].isTip
      });
    }
  }

  return arcs;

}

/**
 * Takes parent data and returns a start value (radians),
 * end value (radians), and radius of circle to draw an 
 * arc from. 
 * thanks https://codereview.stackexchange.com/questions/187510/angle-reflection-function
 */

function reflectAngle (rad, dir) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const PI_sub = "3.1415";

  function checkSign(x) {
    if (x.toString().includes(PI_sub)) {
      x = Math.abs(x);
    }
    return x;
  }

  return checkSign(Math.atan2(...(dir === "X" ? [s, -c] : [-s, c])));
}

/**
 * Takes parent data and returns a start value (radians),
 * end value (radians), and radius of circle to draw an 
 * arc from
 */

function getArcs (pd) {
  // must return start of arc and end
  // these are pairs of edges that have the same parent
  // start is the min(angle) of the children and end is the max(angle)
  // radius is the radius of the parent
  // origin is 0, 0 

  var data = [];
  var root = pd.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];


  // get the branchlength of the parentID
  function sisterAngle(current_parentId) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].parentId === current_parentId) {
        var sister_angle = pd[i].angle;
      }
    }
    return sister_angle;
  }

  function parentRadius(current_parentId) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].thisId === current_parentId) {
        var parent_r = pd[i].r;
      }
    }
    return parent_r;
  }

  for (let i = 0; i < pd.length; i++) {
    if (pd[i].thisId !== root) {
      data.push({
        'start': reflectAngle(Math.min(pd[i].angle, sisterAngle(pd[i].parentId)), "Y"),
        'end': reflectAngle(Math.max(pd[i].angle, sisterAngle(pd[i].parentId)), "Y"),
        'radius': parentRadius(pd[i].parentId),
        'thisId': pd[i].thisId,
        'parentId': pd[i].parentId

      });
    }
  }
  //  TODO: understand why this works (and it may not in every case)... test!
  for (let i = 0; i < data.length; i++) {
    if (Math.sign(data[i].start) !== Math.sign(data[i].end)) {
      data[i].end = Math.abs(data[i].end);
      data[i].start = -Math.abs(data[i].start);
    }
  }

  return data.filter(d => d.start !== d.end & d.radius !== 0);

}

/**
 * Simple wrapper function for getting the data,
 * radii, and arcs.
 */

function radialLayout (node) {
  var data = {};

  // TODO: does radial_data need to be printed out?
  data.data = radialData(node);
  data.radii = getRadii(node);
  data.arcs = getArcs(data.data);

  return data;
}

/**
 * Rectangle layout algorithm.
 * Attempted copy of .layout.rect() function here https://github.com/ArtPoon/ggfree/blob/master/R/tree.R
 */

function getHorizontal (node) {
  // phylodata layout...
  var pd = fortify(node);
  // set y to null... not needed here.
  pd.map(d => d.y = null);
  // where y corresponds to a tip, return tip number
  // make y0 and y1 equal.
  var tipID = 1;
  for (let i = 0; i < pd.length; i++) {
    if (pd[i].isTip === true) {
      pd[i].y0 = tipID;
      pd[i].y1 = tipID;
      tipID += 1;
    }
  }

  // probably incredibly inefficient for large trees.
  // gets the y values of two child branches by looping through the whole tree...
  function yVals(child_1, child_2) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].thisId === child_1) {
        var y1 = pd[i].y0;
      }
      if (pd[i].thisId === child_2) {
        var y2 = pd[i].y0;
      }
    }
    return mean(([y1, y2]))
  }

  // if the node is not a tip...
  for (let i = 0; i < pd.length; i++) {
    if (pd[i].isTip === false) {
      // then y0 === y1 and is the mean of the parental nodes
      pd[i].y0 = yVals(pd[i].children[0], pd[i].children[1]);
      pd[i].y1 = yVals(pd[i].children[0], pd[i].children[1]);
    }
  }

  // find root
  var root = pd.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];

  // sort the data temporarily in decreasing parentId
  pd.sort((a, b) => b.thisId - a.thisId);

  // get the branchlength of the parentID
  function getParentBranchLength(current_parentId) {
    for (var i = 0; i < pd.length; i++) {
      if (pd[i].thisId === current_parentId) {
        var branchLength = pd[i].x1;
      }
    }
    return branchLength;
  }

  // last loop...
  // now get the x0 and x1 coordinates.
  for (let i = 0; i < pd.length; i++) {
    // special cases where parent is the root.
    if (pd[i].parentId === root) {
      // x0 = 0 and x1 is branch length
      pd[i].x0 = 0;
      pd[i].x1 = pd[i].branchLength;
    } else {
      // the x0 is that of the parent
      var parent_branchLength = getParentBranchLength(pd[i].parentId);
      pd[i].x0 = parent_branchLength;
      // the x1 is the sum of parent and current branchlength
      pd[i].x1 = parent_branchLength + pd[i].branchLength;
    }
  }

  // return the original sorted data
  pd.sort((a, b) => a.thisId - b.thisId);

  // remove root?

  // finally get rid of unwanted y, x and angle properties
  /* eslint-disable no-unused-vars */
  return pd.map(({ y, x, angle, ...item }) => item);
  /* eslint-enable no-unused-vars */
}

/**
 * Get the vertical lines to draw.
 */

function getVertical (node) {
  var data = getHorizontal(node);

  // for the current iteration of the loop find the matching parentId
  // then take the difference
  function findPairs(current_node) {
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
        'y1': data[i].y0 + findPairs(data[i]),
        'heights': findPairs(data[i])
      });

    }
  }

  return verticals;
}

/**
 * Simple wrapper for rectangle layout functions
 */

function rectangleLayout (node) {
  var data = {};

  data.data = getHorizontal(node); // horizontal_lines
  data.vertical_lines = getVertical(node);

  return data;
}

/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 */

function edges (df, rectangular = false) {
  var result = [],
    parent;

  // make sure data frame is sorted
  df.sort(function (a, b) {
    return a.thisId - b.thisId;
  });

  for (const row of df) {
    if (row.parentId === null) {
      continue; // skip the root
    }
    parent = df[row.parentId];
    if (parent === null || parent === undefined) continue;

    if (rectangular) {
      var pair1 = {
        x1: row.x,
        y1: row.y,
        id1: row.thisId,
        x2: parent.x,
        y2: row.y,
        id2: undefined
      };
      result.push(pair1);
      var pair2 = {
        x1: parent.x,
        y1: row.y,
        id1: undefined,
        x2: parent.x,
        y2: parent.y,
        id2: row.parentId
      };
      result.push(pair2);
    } else {
      var pair3 = {
        x1: row.x,
        y1: row.y,
        id1: row.thisId,
        x2: parent.x,
        y2: parent.y,
        id2: row.parentId
      };
      result.push(pair3);
    }
  }
  return result;
}

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

/**
 * Simple wrapper function for equalAngleLayout()
 */

function unrooted (node) {
  var data = {};
  // use the Felsenstein equal angle layout algorithm
  var eq = fortify(equalAngleLayout(node));
  data.data = eq;
  // make the edges dataset
  data.edges = edges(eq);

  return data;
}

// find the x & y coordinates of the parental species
function parentFisheye (d, data /* e.g. lwPhylo.unrooted.data */) {
  for (let i = 0; i < data.length; i++) {
    if (d.parentId === data[i].thisId) {
      return {
        px: data[i].fisheye.x,
        py: data[i].fisheye.y
      };
    }
  }
}

/**
 * Parse a Newick tree string into a doubly-linked
 * list of JS Objects.  Assigns node labels, branch
 * lengths and node IDs (numbering terminal before
 * internal nodes).
 */

function readTree (text) {
    // remove whitespace
    text = text.replace(/ \t/g, '');

    var tokens = text.split(/(;|\(|\)|,)/),
        root = { 'parent': null, 'children': [] },
        curnode = root,
        nodeId = 0;

    for (const token of tokens) {
        if (token == "" || token == ';') {
            continue
        }
        if (token == '(') {
            // add a child to current node
            let child = {
                'parent': curnode,
                'children': []
            };
            curnode.children.push(child);
            curnode = child;  // climb up
        }
        else if (token == ',') {
            // climb down, add another child to parent
            curnode = curnode.parent;
            let child = {
                'parent': curnode,
                'children': []
            };
            curnode.children.push(child);
            curnode = child;  // climb up
        }
        else if (token == ')') {
            // climb down twice
            curnode = curnode.parent;
            if (curnode === null) {
                break;
            }
        }
        else {
            var nodeinfo = token.split(':');

            if (nodeinfo.length == 1) {
                if (token.startsWith(':')) {
                    curnode.label = "";
                    curnode.branchLength = parseFloat(nodeinfo[0]);
                } else {
                    curnode.label = nodeinfo[0];
                    curnode.branchLength = null;
                }
            }
            else if (nodeinfo.length == 2) {
                curnode.label = nodeinfo[0];
                curnode.branchLength = parseFloat(nodeinfo[1]);
            }
            else {
                // TODO: handle edge cases with >1 ":"
                console.warn(token, "I don't know what to do with two colons!");
            }
            curnode.id = nodeId++;  // assign then increment
        }
    }

    curnode.id = nodeId;

    return (root);
}

/** 
* Subset a tree given a node - i.e. the node of interests and all the descendents
*/

function subTree (tree, node) {
    // Thanks Richard Challis!
    let fullTree = {};
    tree.data.forEach(obj => {
        fullTree[obj.thisId] = { ...obj };
    });

    let subTree = {};
    const getDescendants = function (rootNodeId) {
        if (fullTree[rootNodeId]) {
            subTree[rootNodeId] = fullTree[rootNodeId];
            if (fullTree[rootNodeId].children) {
                fullTree[rootNodeId].children.forEach(childNodeId => {
                    getDescendants(childNodeId);
                });
            }
        }
    };
    // call the recursive function
    getDescendants(node);

    // in each of the functions, data contains the children key
    const data = [["data", Object.values(subTree)]];

    const nodes = data[0][1].map(d => d.thisId);

    var res = [];
    // in all keys except data, push to new array
    for (const node in tree) {
        if (node === "data") continue;
        res.push([node, tree[node]]);
    }

    var filtered = res.map(d => [
        d[0],
        d[1].filter(d => nodes.includes(d.thisId))
    ]);

    return Object.fromEntries(data.concat(filtered));
}

exports.describeArc = describeArc;
exports.parentFisheye = parentFisheye;
exports.phisheye = phisheye;
exports.radialLayout = radialLayout;
exports.readTree = readTree;
exports.rectangleLayout = rectangleLayout;
exports.subTree = subTree;
exports.unrooted = unrooted;

Object.defineProperty(exports, '__esModule', { value: true });

})));
