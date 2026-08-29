import "./helpers/domSetup.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import drawPhylogeny from "../src/plot/drawPhylogeny.js";
import readTree from "../src/utils/readTree.js";
import { preorder } from "../src/utils/preorder.js";

const newick = "((A:0.1,B:0.2):0.3,(C:0.15,(D:0.1,E:0.2)X:0.1)Y:0.2):0.0;";

function click(el) {
  el.dispatchEvent(new global.window.MouseEvent("click", { bubbles: true }));
}

for (const layout of ["rect", "radial", "unrooted"]) {
  test(`tipRadius controls tip circle size [${layout}]`, () => {
    const svg = drawPhylogeny(newick, { layout, width: 400, height: 400, tipRadius: 9 });
    // by default only tips get a circle (unrooted also draws radius-0 circles for internal nodes)
    const tipCircles = [...svg.querySelectorAll("circle")].filter((el) => Number(el.getAttribute("r")) > 0);
    assert.ok(tipCircles.length > 0);
    tipCircles.forEach((el) => assert.equal(el.getAttribute("r"), "9"));
  });
}

for (const layout of ["rect", "radial", "unrooted"]) {
  test(`internalNodeCircles draws a circle per internal node [${layout}]`, () => {
    const without = drawPhylogeny(newick, { layout, width: 400, height: 400 });
    const withCircles = drawPhylogeny(newick, {
      layout,
      width: 400,
      height: 400,
      internalNodeCircles: true,
      internalNodeRadius: 5
    });
    // 5 nodes are internal: root, the (A,B) clade, Y, and X — vs the tip circle count only by default
    const countWithout = without.querySelectorAll("circle").length;
    const countWith = withCircles.querySelectorAll("circle").length;
    if (layout === "unrooted") {
      // unrooted already has one <circle> per node; only the radius changes
      assert.equal(countWith, countWithout);
      const radii = [...withCircles.querySelectorAll("circle")].map((el) => el.getAttribute("r"));
      assert.ok(radii.includes("5"));
    } else {
      assert.ok(countWith > countWithout);
    }
  });
}

for (const layout of ["rect", "radial", "unrooted"]) {
  test(`nodeLabels renders labeled internal nodes [${layout}]`, () => {
    const svg = drawPhylogeny(newick, { layout, width: 400, height: 400, nodeLabels: true, nodeLabelFontSize: 16 });
    const labels = [...svg.querySelectorAll(".phylo_node_labels text")].map((el) => el.textContent);
    // X and Y are the only labeled internal nodes in the fixture newick
    assert.deepEqual(labels.sort(), ["X", "Y"]);
    svg.querySelectorAll(".phylo_node_labels text").forEach((el) => assert.equal(el.getAttribute("font-size"), "16"));
  });
}

for (const layout of ["rect", "radial", "unrooted"]) {
  test(`scaleBar draws a labeled bar [${layout}]`, () => {
    const svg = drawPhylogeny(newick, { layout, width: 400, height: 400, scaleBar: 0.1 });
    const bar = svg.querySelector(".phylo_scale_bar");
    assert.ok(bar);
    assert.equal(bar.querySelectorAll("line").length, 3); // main bar + 2 end ticks
    assert.equal(bar.querySelector("text").textContent, "0.1");
  });

  test(`no scale bar by default [${layout}]`, () => {
    const svg = drawPhylogeny(newick, { layout, width: 400, height: 400 });
    assert.equal(svg.querySelector(".phylo_scale_bar"), null);
  });
}

test("alignTipLabels [rect] moves labels to a common column with dashed guides", () => {
  const svg = drawPhylogeny(newick, { layout: "rect", width: 400, height: 400, alignTipLabels: true });
  const guides = svg.querySelectorAll(".phylo_align_guides line");
  assert.ok(guides.length > 0);
  guides.forEach((el) => assert.equal(el.getAttribute("stroke-dasharray"), "2,2"));

  const labelXs = new Set([...svg.querySelectorAll(".phylo_labels text")].map((el) => el.getAttribute("x")));
  assert.equal(labelXs.size, 1); // every tip label shares the same x
});

test("alignTipLabels [radial, phylo mode] adds dashed guides to a common ring", () => {
  const svg = drawPhylogeny(newick, {
    layout: "radial",
    width: 400,
    height: 400,
    radialMode: "phylo",
    alignTipLabels: true
  });
  assert.ok(svg.querySelectorAll(".phylo_align_guides line").length > 0);
});

test("without alignTipLabels, rect labels sit at each tip's own x", () => {
  const svg = drawPhylogeny(newick, { layout: "rect", width: 400, height: 400 });
  const labelXs = new Set([...svg.querySelectorAll(".phylo_labels text")].map((el) => el.getAttribute("x")));
  assert.ok(labelXs.size > 1);
  assert.equal(svg.querySelectorAll(".phylo_align_guides line").length, 0);
});

test("drawPhylogeny accepts an already-parsed tree object, not just Newick text", () => {
  const tree = readTree(newick);
  const svg = drawPhylogeny(tree, { layout: "rect", width: 400, height: 400 });
  assert.ok(svg.querySelectorAll("circle").length > 0);
});

for (const layout of ["rect", "radial", "unrooted"]) {
  test(`onNodeClick fires when an internal node circle is clicked [${layout}]`, () => {
    const clicked = [];
    const svg = drawPhylogeny(newick, {
      layout,
      width: 400,
      height: 400,
      internalNodeCircles: true,
      onNodeClick: (node) => clicked.push(node)
    });
    // d3 binds the joined datum onto each DOM node as __data__
    const internalCircles = [...svg.querySelectorAll("circle")].filter((el) => el.__data__?.isTip === false);
    assert.ok(internalCircles.length > 0);
    internalCircles.forEach(click);
    assert.equal(clicked.length, internalCircles.length);
    clicked.forEach((node) => assert.equal(node.isTip, false));
  });

  test(`onNodeClick is not wired up without internalNodeCircles [${layout}]`, () => {
    let called = false;
    const svg = drawPhylogeny(newick, { layout, width: 400, height: 400, onNodeClick: () => { called = true; } });
    [...svg.querySelectorAll("circle")].forEach(click);
    assert.equal(called, false);
  });
}

test("onNodeClick exposes the same node ids as the tree object passed in (stable across repeated renders)", () => {
  const tree = readTree(newick);
  const internalIds = new Set(
    preorder(tree).filter((n) => n.children.length > 0).map((n) => n.id)
  );
  const seen = new Set();

  // render twice from the same tree object, as the demo does after a rotate() + redraw
  for (let i = 0; i < 2; i++) {
    const svg = drawPhylogeny(tree, {
      layout: "rect",
      width: 400,
      height: 400,
      internalNodeCircles: true,
      onNodeClick: (node) => seen.add(node.thisId)
    });
    [...svg.querySelectorAll(".phylo_internal_dots circle")].forEach(click);
  }

  assert.deepEqual(seen, internalIds);
});

test("rotateOnClick without a container throws", () => {
  assert.throws(
    () => drawPhylogeny(newick, { layout: "rect", rotateOnClick: true }),
    /requires a `container`/
  );
});

test("rotateOnClick auto-enables internalNodeCircles unless overridden", () => {
  const enabled = drawPhylogeny(newick, {
    layout: "rect",
    width: 400,
    height: 400,
    container: document.createElement("div"),
    rotateOnClick: true
  });
  assert.ok(enabled.querySelectorAll(".phylo_internal_dots circle").length > 0);

  const overridden = drawPhylogeny(newick, {
    layout: "rect",
    width: 400,
    height: 400,
    container: document.createElement("div"),
    rotateOnClick: true,
    internalNodeCircles: false
  });
  assert.equal(overridden.querySelectorAll(".phylo_internal_dots circle").length, 0);
});

test("container mounts the svg and rotateOnClick self-redraws into it, in place", () => {
  const el = document.createElement("div");
  const svg1 = drawPhylogeny(newick, { layout: "rect", width: 400, height: 400, container: el, rotateOnClick: true });

  assert.equal(el.children.length, 1);
  assert.equal(el.firstChild, svg1);

  const tipOrder = () =>
    [...el.querySelectorAll(".phylo_labels text")]
      .map((e) => [+e.getAttribute("y"), e.childNodes[0].nodeValue])
      .sort((a, b) => a[0] - b[0])
      .map((p) => p[1]);

  const before = tipOrder();
  click(el.querySelector(".phylo_internal_dots circle"));

  // the redraw happened inside the click handler and remounted into the
  // same container — still exactly one <svg>, with a different tip order
  assert.equal(el.children.length, 1);
  assert.notDeepEqual(tipOrder(), before);
});

test("container accepts a CSS selector string", () => {
  const el = document.createElement("div");
  el.id = "container-selector-test";
  document.body.appendChild(el);
  try {
    const svg = drawPhylogeny(newick, { layout: "rect", width: 400, height: 400, container: "#container-selector-test" });
    assert.equal(el.firstChild, svg);
  } finally {
    document.body.removeChild(el);
  }
});

test("a user-supplied onNodeClick still fires alongside rotateOnClick", () => {
  const calls = [];
  const el = document.createElement("div");
  drawPhylogeny(newick, {
    layout: "rect",
    width: 400,
    height: 400,
    container: el,
    rotateOnClick: true,
    onNodeClick: (node) => calls.push(node.thisId)
  });
  click(el.querySelector(".phylo_internal_dots circle"));
  assert.equal(calls.length, 1);
});
