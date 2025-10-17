'use strict';

var d3 = require('d3');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var d3__namespace = /*#__PURE__*/_interopNamespaceDefault(d3);

// src/radial/polarToCartesian.js
function polarToCartesian (cx, cy, r, t) {
  return { x: cx + r * Math.cos(t), y: cy - r * Math.sin(t) };
}

/**
 * Draw the shortest arc between startAngle and endAngle (radians), CCW.
 * If the CW path is shorter, swap start/end so the CCW path is still shortest.
 * Works with Y-inverted screen coords (polarToCartesian already inverts Y).
 */
function describeArc(cx, cy, radius, startAngle, endAngle) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;
  let a0 = norm(startAngle);
  let a1 = norm(endAngle);

  // CCW and CW spans
  const ccw = (a1 - a0 + TAU) % TAU;
  const cw = (a0 - a1 + TAU) % TAU;

  // Ensure we always take the shorter span *in CCW* by swapping if needed
  if (cw < ccw) {
    const tmp = a0; a0 = a1; a1 = tmp;
  }

  const delta = (a1 - a0 + TAU) % TAU;          // now the shorter CCW span
  if (delta < 1e-9) {
    const p = polarToCartesian(cx, cy, radius, a0);
    return `M ${p.x} ${p.y}`;                   // degenerate span → no arc
  }

  const largeArcFlag = delta > Math.PI ? 1 : 0; // should be 0 for “shortest”, but keep for safety
  const sweepFlag = 0;                          // CCW

  const p0 = polarToCartesian(cx, cy, radius, a0);
  const p1 = polarToCartesian(cx, cy, radius, a1);

  return `M ${p0.x} ${p0.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${p1.x} ${p1.y}`;
}

/**
 * Recursive function for pre-order traversal of tree (returns array)
 */
function preorder(node, list = []) {
  list.push(node);
  for (let i = 0; i < (node.children?.length || 0); i++) {
    list = preorder(node.children[i], list);
  }
  return list;
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
 * Compute per-node polar coordinates for radial layout:
 *  - Tip angles: evenly spaced 0..2π in tip DFS order
 *  - Internal angles: circular mean of child angles
 *  - Radii: cumulative branch length from root
 *  - x,y: cartesian projection
 *
 * Returns the fortified array with added {angle, r, x, y}.
 */
function radialData(node) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;

  const pd = fortify(node, /*sort*/ true);
  const byId = new Map(pd.map(d => [d.thisId, d]));
  const kids = new Map(pd.map(d => [d.thisId, d.children || []]));

  // Find root id
  let root = null;
  for (const d of pd) {
    if (d.parentId == null) { root = d.thisId; break; }
  }

  // Collect tip ids in DFS left->right order to preserve input ordering
  const tipIds = [];
  (function dfs(id) {
    const c = kids.get(id) || [];
    if (c.length === 0) {
      tipIds.push(id);
      return;
    }
    for (const ch of c) dfs(ch);
  })(root);

  // Assign tip angles evenly spaced 0..2π
  const N = Math.max(1, tipIds.length);
  const angle = new Map();
  tipIds.forEach((id, i) => {
    angle.set(id, (i / N) * TAU);
  });

  // Internal node angles: circular mean of child angles (post-order)
  (function setInternalAngles(id) {
    const c = kids.get(id) || [];
    for (const ch of c) setInternalAngles(ch);
    if (c.length > 0) {
      let sx = 0, sy = 0;
      for (const ch of c) {
        const th = angle.get(ch);
        sx += Math.cos(th);
        sy += Math.sin(th);
      }
      angle.set(id, norm(Math.atan2(sy, sx)));
    }
  })(root);

  // Radii: cumulative branch lengths from root (root r=0)
  const radius = new Map();
  radius.set(root, 0);
  (function setR(id) {
    const c = kids.get(id) || [];
    const r0 = radius.get(id) || 0;
    for (const ch of c) {
      const child = byId.get(ch);
      const bl = child?.branchLength ?? 0;
      radius.set(ch, r0 + bl);
      setR(ch);
    }
  })(root);

  // Enrich pd rows with angle, r, x, y
  for (const d of pd) {
    const th = angle.get(d.thisId) ?? 0;
    const r  = radius.get(d.thisId) ?? 0;
    d.angle = th;
    d.r = r;
    d.x = r * Math.cos(th);
    d.y = r * Math.sin(th);
  }

  return pd;
}

/**
 * Per-edge radial segments (for highlighting and drawing).
 * For each non-root node, draw a radial line from the parent radius to the child radius
 * at the CHILD'S angle.
 *
 * Output: [{ parentId, childId, x0, y0, x1, y1, isTip }]
 */
function getRadii(node) {
  const data = radialData(node);
  const byId = new Map(data.map(d => [d.thisId, d]));
  const root = data.find(d => d.parentId == null)?.thisId;

  const segments = [];
  for (const d of data) {
    if (d.thisId === root) continue;
    const parent = byId.get(d.parentId);
    if (!parent) continue;

    const theta = d.angle;
    const r0 = parent.r;
    const r1 = d.r;

    segments.push({
      parentId: parent.thisId,
      childId: d.thisId,
      x0: r0 * Math.cos(theta),
      y0: r0 * Math.sin(theta),
      x1: r1 * Math.cos(theta),
      y1: r1 * Math.sin(theta),
      isTip: !!d.isTip
    });
  }
  return segments;
}

/**
 * Build arc descriptors for each internal parent:
 *  - One arc per internal node at radius = parent.r
 *  - Start/end angles choose the *shortest* wrap-aware span covering the children
 *  - Skips degenerate spans (delta ~ 0)
 */
function getArcs(pd) {
  const TAU = Math.PI * 2;
  const norm = (t) => ((t % TAU) + TAU) % TAU;
  const EPS = 1e-6;

  // Quick lookups
  new Map(pd.map(d => [d.thisId, d]));
  const childrenByParent = new Map();
  let root = null;

  for (const d of pd) {
    if (d.parentId == null) root = d.thisId;
    if (!childrenByParent.has(d.parentId)) childrenByParent.set(d.parentId, []);
    childrenByParent.get(d.parentId).push(d);
  }

  const arcs = [];

  for (const parent of pd) {
    const pid = parent.thisId;
    if (pid === root) continue; // no arc above root
    const kids = childrenByParent.get(pid) || [];
    if (kids.length < 2) continue; // need at least two children

    // Collect & sort child angles
    const A = kids.map(k => norm(k.angle)).sort((a, b) => a - b);
    const aMin = A[0], aMax = A[A.length - 1];

    // Two candidate spans: direct (aMin -> aMax) and wrapped (aMax -> aMin across 2π)
    const direct = aMax - aMin;
    const wrapped = TAU - direct;

    // Choose the shorter span. We'll draw **CCW** (sweepFlag = 0) in describeArc.
    let start, end, span;
    if (direct <= wrapped) {
      start = aMin;
      end = aMax;
      span = direct;
    } else {
      // wrapped is shorter: go CCW from aMax up through 2π to aMin
      start = aMax;
      end = aMin;
      span = wrapped;
    }

    if (span < EPS || !isFinite(parent.r) || parent.r <= 0) continue;

    arcs.push({
      start,
      end,
      radius: parent.r,
      thisId: pid,
      parentId: parent.parentId
    });
  }

  return arcs;
}

/**
 * Per-child "half" arcs for radial trees.
 *
 * For each non-root node (child), emit an arc at the PARENT's radius that
 * spans between the parent's angle and the child's angle. This is the arc
 * segment that meets the child's spoke and is ideal for root→tip highlighting.
 *
 * Input:  pd — the array returned by radialData(node) (each row has .thisId, .parentId, .angle, .r)
 * Output: [{ parentId, childId, radius, start, end }]
 */
function getChildArcs(pd) {
  const byId = new Map(pd.map(d => [d.thisId, d]));
  const arcs = [];

  for (const child of pd) {
    if (child.parentId == null) continue; // skip root
    const parent = byId.get(child.parentId);
    if (!parent) continue;

    arcs.push({
      parentId: parent.thisId,
      childId: child.thisId,
      radius: parent.r,        // draw on the parent's circle
      start: parent.angle,     // start at parent's angle
      end: child.angle         // end at child's angle (describeArc will choose the shortest CCW span)
    });
  }

  return arcs;
}

/**
 * Simple wrapper for radial layout:
 *  - data: per-node { angle, r, x, y, ... }
 *  - radii: per-edge radial spokes (parent.r → child.r)
 *  - arcs: per-parent arcs spanning all children at parent's radius
 *  - child_arcs: per-child half-arcs (parent.angle → child.angle) at parent's radius
 */
function radialLayout(node) {
  const data = {};
  data.data = radialData(node);
  data.radii = getRadii(node);
  data.arcs = getArcs(data.data);
  data.child_arcs = getChildArcs(data.data);
  return data;
}

/**
 * Iterable mean
 * Poached from https://github.com/d3/d3-array/blob/master/src/mean.js
 * (Other array means buggered up the tree)
 */

function mean (values, valueof) {
    let count = 0;
    let sum = 0;
    {
        for (let value of values) {
            if (value != null && (value = +value) >= value) {
                ++count, sum += value;
            }
        }
    }
    if (count) return sum / count;
}

/**
 * Rectangle layout: compute per-node x0,x1 and y0=y1
 * - Tip y is assigned by input order (preserves ladderize/order)
 * - Internal node y is mean of child y's
 * - x1 accumulates branch lengths from root
 */

function getHorizontal(node) {
  const pd = fortify(node);

  // Fast lookup from id -> pd index
  const idIndex = new Map(pd.map((d, i) => [d.thisId, i]));

  // 1) Leaf order from the INPUT TREE (respects your child order / ladderize)
  const leafIds = [];
  (function dfs(n) {
    if (!n.children || n.children.length === 0) { leafIds.push(n.id); return; }
    n.children.forEach(dfs);
  })(node);

  // Map each leaf id to a vertical slot (1..N)
  const tipSlot = new Map(leafIds.map((id, i) => [id, i + 1]));

  // 2) Set Y for tips directly from that order; internal node Y via children mean
  (function setY(n) {
    const i = idIndex.get(n.id);
    if (!n.children || n.children.length === 0) {
      const y = tipSlot.get(n.id);
      pd[i].y0 = y; pd[i].y1 = y;
      return y;
    }
    const ys = n.children.map(setY);
    const y = mean(ys);
    pd[i].y0 = y; pd[i].y1 = y;
    return y;
  })(node);

  // 3) Set X by accumulating branch lengths down the tree
  (function setX(n, xParent) {
    const i = idIndex.get(n.id);
    const bl = pd[i].branchLength ?? 0;
    const x0 = xParent ?? 0;
    const x1 = x0 + bl;
    pd[i].x0 = x0; pd[i].x1 = x1;
    if (n.children && n.children.length) n.children.forEach(c => setX(c, x1));
  })(node, 0);

  // Clean up: remove fields not needed downstream without triggering no-unused-vars
  return pd.map((row) => {
    const { y: _y, x: _x, angle: _angle, ...item } = row;
    return item;
  });
}

function getVertical(node) {
  const data = getHorizontal(node);

  // Group rows by parentId (children that share a parent)
  const byParent = new Map();
  for (const row of data) {
    if (row.parentId == null) continue;
    const a = byParent.get(row.parentId);
    if (a) a.push(row); else byParent.set(row.parentId, [row]);
  }

  const verticals = [];
  for (const [parentId, kids] of byParent.entries()) {
    if (!kids.length) continue;
    // Works for binary and multifurcations:
    const yvals = kids.map(d => d.y0);
    const y0 = Math.min(...yvals);
    const y1 = Math.max(...yvals);
    // All children share the same junction x (their x0)
    const x = kids[0].x0;

    verticals.push({
      parentId,
      x0: x,
      x1: x,
      y0,
      y1,
      heights: y1 - y0
    });
  }

  return verticals;
}

/**
 * Build per-child vertical segments for a rectangular tree:
 * For each non-root node (child), draw a vertical from (parent.x, child.y) to (parent.x, parent.y).
 * This yields exactly one vertical per edge (child->parent), making highlighting trivial.
 *
 * Returns an array of:
 *   {
 *     parentId: number,
 *     childId: number,
 *     x: number,         // x of the parent junction
 *     y0: number,        // min(child.y, parent.y)
 *     y1: number,        // max(child.y, parent.y)
 *   }
 */
function getChildVerticals(node) {
  const data = getHorizontal(node); // has parentId, thisId, x0,x1,y0=y1

  // Build a quick index to access parent's y by id
  const byId = new Map(data.map(d => [d.thisId, d]));

  const childVerticals = [];

  for (const d of data) {
    if (d.parentId == null) continue;
    const parent = byId.get(d.parentId);
    if (!parent) continue;

    const x = d.x0;            // child’s vertical sits at parent.x == child.x0
    const yc = d.y0;           // child y
    const yp = parent.y0;      // parent y
    const y0 = Math.min(yc, yp);
    const y1 = Math.max(yc, yp);

    childVerticals.push({
      parentId: d.parentId,
      childId: d.thisId,
      x,
      y0,
      y1
    });
  }

  return childVerticals;
}

/**
 * Rectangle layout wrapper.
 * Returns:
 *  - data: per-node rows (x0,x1,y0=y1,...)
 *  - vertical_lines: single spanning vertical per parent (baseline draw)
 *  - child_vertical_lines: one vertical per edge (for highlighting)
 *  - horizontal_lines: per-edge child horizontals (x0->x1 at y), with labels & tip flags
 */
function rectangleLayout(node) {
  const data = getHorizontal(node);              // per-node
  const vertical_lines = getVertical(node);      // parent spans
  const child_vertical_lines = getChildVerticals(node); // per-edge verticals

  // IMPORTANT: include y0 & y1, and carry isTip/labels for the renderer
  new Map(data.map(d => [d.thisId, d]));
  const horizontal_lines = data
    .filter(d => d.parentId != null)
    .map(d => ({
      parentId: d.parentId,
      childId: d.thisId,
      thisId: d.thisId,
      thisLabel: d.thisLabel,
      isTip: d.isTip,
      x0: d.x0,
      x1: d.x1,
      y0: d.y0,
      y1: d.y0
    }));

  return { data, vertical_lines, child_vertical_lines, horizontal_lines };
}

/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 */

function edges(df, rectangular = false) {
  const rows = [...df].sort((a, b) => a.thisId - b.thisId);
  const byId = new Map(rows.map((r) => [r.thisId, r]));
  const result = [];

  for (const row of rows) {
    if (row.parentId == null) continue;
    const parent = byId.get(row.parentId);
    if (!parent) continue;

    if (rectangular) {
      result.push({ x1: row.x, y1: row.y, id1: row.thisId, x2: parent.x, y2: row.y, id2: undefined });
      result.push({ x1: parent.x, y1: row.y, id1: undefined, x2: parent.x, y2: parent.y, id2: row.parentId });
    } else {
      result.push({ x1: row.x, y1: row.y, id1: row.thisId, x2: parent.x, y2: parent.y, id2: row.parentId });
    }
  }
  return result;
}

/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 */

function levelorder(root) {
  const queue = [root], result = [];
  while (queue.length) {
    const curnode = queue.shift();         // <- FIFO
    result.push(curnode);
    for (const child of curnode.children) queue.push(child);
  }
  return result;
}


/**
 * Count the number of tips that descend from this node
 */

function numTips(thisnode) {
  var result = 0;
  for (const node of levelorder(thisnode)) {
    if (node.children.length == 0) result++;
  }
  return (result);
}

/**
 * Equal-angle layout for unrooted trees.
 * - Precomputes ntips in O(n) to avoid repeated subtree counts
 * - Uses angles in "π units" (0..2) to match existing API
 * - Populates x,y positions from branchLength and angle
 */

function annotateTipCounts(root) {
  (function post(n) {
    if (!n.children || n.children.length === 0) {
      n.ntips = 1; return 1;
    }
    let sum = 0;
    for (const c of n.children) sum += post(c);
    n.ntips = sum;
    return sum;
  })(root);
  return root;
}

function equalAngleLayout(node) {
  if (node.parent === null) {
    annotateTipCounts(node);
    node.start = 0.;     // guarantees no arcs overlap 0
    node.end = 2.;       // *π
    node.angle = 0.;     // irrelevant at root
    node.ntips = numTips(node); // safe (already computed), left for compatibility
    node.x = 0;
    node.y = 0;
  }

  let lastStart = node.start;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const arc = (node.end - node.start) * (child.ntips / node.ntips);

    child.start = lastStart;
    child.end = lastStart + arc;

    // bisect the arc in π-units
    child.angle = child.start + (child.end - child.start) / 2.;
    lastStart = child.end;

    // map to coordinates (convert π-units to radians by multiplying by Math.PI)
    const theta = child.angle * Math.PI;
    const bl = (child.branchLength ?? 0);
    child.x = node.x + bl * Math.sin(theta);
    child.y = node.y + bl * Math.cos(theta);

    equalAngleLayout(child);
  }

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

/**
 * Parse a Newick tree string into a doubly-linked list of JS Objects.
 * Assigns labels, branch lengths, and node IDs (tips before internals if input emits them that way).
 *
 * Notes / limitations:
 * - Quoted labels and NHX annotations are not fully supported.
 * - Branch lengths in scientific notation are supported (parseFloat).
 */

function readTree(text) {
  // Remove all whitespace (space, tabs, newlines)
  text = String(text).replace(/\s+/g, '');

  const tokens = text.split(/(;|\(|\)|,)/);
  const root = { parent: null, children: [] };
  let curnode = root;
  let nodeId = 0;

  for (const token of tokens) {
    if (!token || token === ';') continue;

    if (token === '(') {
      const child = { parent: curnode, children: [] };
      curnode.children.push(child);
      curnode = child; // descend
    } else if (token === ',') {
      // back to parent, then create sibling
      curnode = curnode.parent;
      const child = { parent: curnode, children: [] };
      curnode.children.push(child);
      curnode = child;
    } else if (token === ')') {
      // ascend one level
      curnode = curnode.parent;
      if (curnode === null) break;
    } else {
      // label/branch-length chunk (e.g., "A:0.01" or "A")
      const nodeinfo = token.split(':');
      if (nodeinfo.length === 1) {
        if (token.startsWith(':')) {
          curnode.label = '';
          curnode.branchLength = parseFloat(nodeinfo[0]);
        } else {
          curnode.label = nodeinfo[0];
          curnode.branchLength = null;
        }
      } else if (nodeinfo.length === 2) {
        curnode.label = nodeinfo[0];
        curnode.branchLength = parseFloat(nodeinfo[1]);
      } else {
        console.warn(token, "Unhandled token with multiple ':' characters");
        curnode.label = nodeinfo[0] || '';
        curnode.branchLength = parseFloat(nodeinfo[nodeinfo.length - 1]);
      }
      curnode.id = nodeId++; // assign then increment
    }
  }

  // Ensure root has an id if not assigned during parsing
  if (root.id == null) root.id = nodeId;

  return root;
}

function drawPhylogeny(
  treeText,
  {
    layout = "rect", // "rect" or "radial"
    width = 800,
    height = 800,
    margin = { top: 20, right: 300, bottom: 20, left: 50 },
    radialMargin = 80,
    strokeWidth = 1,
    radialMode = "outer" // or "align"
  } = {}
) {
  if (layout === "rect") {
    // RECTANGULAR LAYOUT
    const tree_df = rectangleLayout(readTree(treeText));
    const horizontal = tree_df.horizontal_lines;
    const vertical = tree_df.vertical_lines;
    const tips = horizontal.filter((d) => d.isTip);

    const maxY = d3__namespace.max(horizontal, (d) => d.y1);
    const minY = d3__namespace.min(horizontal, (d) => d.y1);
    const maxX = d3__namespace.max(horizontal, (d) => d.x1);

    const yScale = d3__namespace
      .scaleLinear()
      .domain([minY - 1, maxY + 1])
      .range([margin.top, height - margin.bottom]);

    const xScale = d3__namespace
      .scaleLinear()
      .domain([0, maxX])
      .range([margin.left, width - margin.right]);

    const svg = d3__namespace
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    const group = svg.append("g");

    group
      .selectAll(".hline")
      .data(horizontal)
      .join("line")
      .attr("x1", (d) => xScale(d.x0))
      .attr("y1", (d) => yScale(d.y0))
      .attr("x2", (d) => xScale(d.x1))
      .attr("y2", (d) => yScale(d.y1))
      .attr("stroke", "#555")
      .attr("stroke-width", strokeWidth);

    group
      .selectAll(".vline")
      .data(vertical)
      .join("line")
      .attr("x1", (d) => xScale(d.x0))
      .attr("y1", (d) => yScale(d.y0))
      .attr("x2", (d) => xScale(d.x1))
      .attr("y2", (d) => yScale(d.y1))
      .attr("stroke", "#555")
      .attr("stroke-width", strokeWidth);

    group
      .selectAll(".tip-dot")
      .data(tips)
      .join("circle")
      .attr("cx", (d) => xScale(d.x1))
      .attr("cy", (d) => yScale(d.y1))
      .attr("r", 2)
      .attr("fill", "black");

    svg
      .append("g")
      .selectAll("text")
      .data(tips)
      .join("text")
      .attr("x", (d) => xScale(d.x1) + 4)
      .attr("y", (d) => yScale(d.y1))
      .attr("dy", "0.32em")
      .attr("font-size", 10)
      .text((d) => d.thisLabel?.replace(/_/g, " ") ?? "");

    return svg.node();
  } else if (layout === "radial") {
    const parsedTree = readTree(treeText);
    const rad = radialLayout(parsedTree);

    // ===== MODE =====
    const TIP_MODE = radialMode; // "align" (shorten to original tips) or "outer" (project to one circle)
    const isOuter = TIP_MODE === "outer";

    // visuals (0 = let spokes reach the dots)
    const DOT_R = 3;
    const END_CAP = 0;

    // ===== SCALES / BOUNDS =====
    const maxRadius = d3__namespace.max(rad.data, (d) => d.r) ?? 0;
    const scaleRadial = maxRadius + 2 * radialMargin;
    const w = width,
      h = height;
    const centerX = w / 2,
      centerY = h / 2;

    const xScaleRadial = d3__namespace
      .scaleLinear()
      .domain([-scaleRadial, scaleRadial])
      .range([0, w]);
    const yScaleRadial = d3__namespace
      .scaleLinear()
      .domain([-scaleRadial, scaleRadial])
      .range([h, 0]);
    const radiusPx = (r) => r * (w / (2 * scaleRadial));

    // ===== INDEXES / HELPERS =====
    const byId = new Map(rad.data.map((d) => [d.thisId, d]));
    const tips = rad.data.filter((d) => d.isTip);
    const tipMaxR = tips.length ? d3__namespace.max(tips, (d) => d.r) : 0;

    // Robust child-id extractor (handles multiple shapes)
    function childIdOf(spoke) {
      // prefer explicit child id fields; fall back to thisId; last-ditch id1 (seen in some edge shapes)
      return spoke.childId ?? spoke.thisId ?? spoke.id1 ?? null;
    }

    // Shorten the *screen-space* end of a spoke by END_CAP px
    function shortenSpokePx(x0, y0, x1, y1) {
      const X0 = xScaleRadial(x0),
        Y0 = yScaleRadial(y0);
      const X1 = xScaleRadial(x1),
        Y1 = yScaleRadial(y1);
      const dx = X1 - X0,
        dy = Y1 - Y0;
      const len = Math.hypot(dx, dy) || 1;
      const t = Math.max(0, (len - END_CAP) / len);
      return { X0, Y0, X1s: X0 + dx * t, Y1s: Y0 + dy * t, len };
    }

    // ===== SVG ROOT =====
    const svg = d3__namespace
      .create("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    const group = svg.append("g");

    // ===== ARCS (parent circles) =====
    group
      .append("g")
      .attr("class", "phylo_arcs")
      .selectAll("path")
      .data(rad.arcs)
      .join("path")
      .attr("d", (d) =>
        describeArc(
          centerX,
          centerY,
          Math.max(0, radiusPx(d.radius)),
          d.start,
          d.end
        )
      )
      .attr("fill", "none")
      .attr("stroke", "#777")
      .attr("stroke-width", strokeWidth);

    // ===== RADII (spokes) =====
    group
      .append("g")
      .attr("class", "phylo_radii")
      .selectAll("line")
      .data(rad.radii)
      .join("line")
      .each(function(s, _) {
        // parent end (data space)
        const x0 = s.x0,
          y0 = s.y0;

        // child end (data space), shape-agnostic
        const cid = childIdOf(s);
        const node = cid != null ? byId.get(cid) : undefined;
        const isTipSpoke = !!(node && node.isTip);

        // default to the original child endpoint from the spoke record
        let x1 = s.x1,
          y1 = s.y1;

        // In "outer" mode, project only *tip* spokes to the common circle
        if (isOuter && isTipSpoke) {
          x1 = tipMaxR * Math.cos(node.angle);
          y1 = tipMaxR * Math.sin(node.angle);
        }

        // Shorten in screen space so the spoke doesn’t pierce the dot (END_CAP can be 0)
        const { X0, Y0, X1s, Y1s} = shortenSpokePx(x0, y0, x1, y1);

        d3__namespace.select(this)
          .attr("x1", X0)
          .attr("y1", Y0)
          .attr("x2", X1s)
          .attr("y2", Y1s)
          .attr("stroke", "#777")
          .attr("stroke-width", strokeWidth);
      });

    // ===== TIP DOTS =====
    group
      .append("g")
      .attr("class", "phylo_tip_dots")
      .selectAll("circle")
      .data(tips)
      .join("circle")
      .each(function(d, _) {
        // dot at original tip (align) or projected circle (outer)
        const x = isOuter ? tipMaxR * Math.cos(d.angle) : d.x;
        const y = isOuter ? tipMaxR * Math.sin(d.angle) : d.y;

        d3__namespace.select(this)
          .attr("cx", xScaleRadial(x))
          .attr("cy", yScaleRadial(y))
          .attr("r", DOT_R)
          .attr("fill", "black")
          .attr("stroke", "black")
          .attr("stroke-width", 1.5);
      });

    // ===== LABELS (unchanged) =====
    // Labels — make them follow the tip position used by the current mode
    group
      .append("g")
      .attr("class", "phylo_labels")
      .selectAll("g.label")
      .data(tips) // <— bind only tip nodes
      .join("g")
      .attr("class", "label")
      .attr("transform", (d) => {
        // same tip position rule as dots/spokes:
        //  - "outer": snap to common ring (tipMaxR)
        //  - otherwise (e.g. "align"/"phylo"): true tip radius
        const r = isOuter ? tipMaxR : d.r;
        const x = r * Math.cos(d.angle);
        const y = r * Math.sin(d.angle);
        return `translate(${xScaleRadial(x)},${yScaleRadial(y)})`;
      })
      .each(function(d) {
        // rotate so text reads outward; flip when on the left side
        let angle = (-d.angle * 180) / Math.PI;
        let xoff = 10; // radial padding for text (px)
        let anchor = "start";
        if (d.angle > Math.PI / 2 && d.angle < (3 * Math.PI) / 2) {
          angle += 180;
          xoff *= -1;
          anchor = "end";
        }
        d3__namespace.select(this)
          .append("g")
          .attr("transform", `rotate(${angle})`)
          .append("text")
          .attr("x", xoff)
          .attr("alignment-baseline", "middle")
          .attr("text-anchor", anchor)
          .attr("font-size", 10)
          .attr("fill", "black")
          .text((d) => d.thisLabel?.replace(/_/g, " ") ?? "");
      });

    return svg.node();
  } else if (layout === "unrooted") {
    // UNROOTED LAYOUT
    const parsedTree = readTree(treeText);
    const unrootedPhylo = unrooted(parsedTree);

    const w = width;
    const h = height;

    // Get spatial extent
    const xExtent = d3__namespace.extent(unrootedPhylo.data, (d) => d.x);
    const yExtent = d3__namespace.extent(unrootedPhylo.data, (d) => d.y);

    // Find maximum absolute distance from center (0,0)
    const maxX = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
    const maxY = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
    const maxRadius = Math.max(maxX, maxY);

    // Add some margin
    const scaleUnroot = maxRadius + 2 * radialMargin;

    const xScaleUnroot = d3__namespace
      .scaleLinear()
      .domain([-scaleUnroot, scaleUnroot])
      .range([0, w]);

    const yScaleUnroot = d3__namespace
      .scaleLinear()
      .domain([-scaleUnroot, scaleUnroot])
      .range([h, 0]);

    const svg = d3__namespace
      .create("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    const group = svg.append("g");

    // Edges
    group
      .append("g")
      .attr("class", "phylo_lines")
      .selectAll("line")
      .data(unrootedPhylo.edges)
      .join("line")
      .attr("x1", (d) => xScaleUnroot(d.x1))
      .attr("y1", (d) => yScaleUnroot(d.y1))
      .attr("x2", (d) => xScaleUnroot(d.x2))
      .attr("y2", (d) => yScaleUnroot(d.y2))
      .attr("stroke-width", strokeWidth)
      .attr("stroke", "#777");

    // Nodes
    group
      .append("g")
      .attr("class", "phylo_points")
      .selectAll("circle")
      .data(unrootedPhylo.data)
      .join("circle")
      .attr("class", "dot")
      .attr("r", (d) => (d.isTip ? 4 : 0))
      .attr("cx", (d) => xScaleUnroot(d.x))
      .attr("cy", (d) => yScaleUnroot(d.y))
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("fill", (d) => (d.isTip ? "black" : "white"));

    // Tip labels
    const tipEdges = new Map();
    const nodesById = new Map(unrootedPhylo.data.map((d) => [d.thisId, d]));

    unrootedPhylo.edges.forEach((edge) => {
      const tipNode = nodesById.get(edge.id1);
      if (tipNode?.isTip) {
        tipEdges.set(edge.id1, edge);
      }
    });

    group
      .append("g")
      .attr("class", "phylo_labels")
      .selectAll("g")
      .data(unrootedPhylo.data.filter((d) => d.isTip))
      .join("g")
      .attr("transform", (d) => {
        const x = xScaleUnroot(d.x);
        const y = yScaleUnroot(d.y);
        return `translate(${x},${y})`;
      })
      .each(function(d) {
        const edge = tipEdges.get(d.thisId);
        if (!edge) {
          console.warn(
            "No incoming edge found for tip node:",
            d.thisId,
            d.thisLabel
          );
          return;
        }

        // Compute angle of the incoming edge (screen coords)
        const x1 = xScaleUnroot(edge.x1);
        const y1 = yScaleUnroot(edge.y1);
        const x2 = xScaleUnroot(edge.x2);
        const y2 = yScaleUnroot(edge.y2);

        const dx = x2 - x1;
        const dy = y2 - y1;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Flip label if upside down
        let xOffset = -10;
        let anchor = "end";
        if (angle > 90 || angle < -90) {
          angle += 180;
          anchor = "start";
          xOffset = 10;
        }

        // Draw label rotated along branch direction
        d3__namespace.select(this)
          .append("g")
          .attr("transform", `rotate(${angle})`)
          .append("text")
          .attr("x", xOffset)
          .attr("alignment-baseline", "middle")
          .attr("text-anchor", anchor)
          .attr("font-size", 10)
          .attr("fill", "black")
          .text(d.thisLabel?.replace(/_/g, " ") ?? "");
      });

    return svg.node();
  } else {
    throw new Error("Unsupported layout type. Use 'rect' or 'radial'.");
  }
}

module.exports = drawPhylogeny;
//# sourceMappingURL=drawPhylogeny.cjs.map
