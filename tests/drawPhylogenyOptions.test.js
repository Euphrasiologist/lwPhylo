import "./helpers/domSetup.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import drawPhylogeny from "../src/plot/drawPhylogeny.js";

const newick = "((A:0.1,B:0.2):0.3,(C:0.15,(D:0.1,E:0.2)X:0.1)Y:0.2):0.0;";

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
