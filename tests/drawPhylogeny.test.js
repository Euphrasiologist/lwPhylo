import "./helpers/domSetup.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import drawPhylogeny from "../src/plot/drawPhylogeny.js";
import readTree from "../src/utils/readTree.js";
import { preorder } from "../src/utils/preorder.js";

// End-to-end check of the path a real user takes: a raw newick string in,
// an <svg> DOM node out, ready to be appended to the page.
const cases = {
  "branch lengths everywhere": "((A:0.1,B:0.2):0.3,(C:0.15,(D:0.1,E:0.2):0.1):0.2):0.0;",
  "no branch lengths at all": "((A,B),(C,D));",
  "tip branch lengths only (no internal branch lengths)": "((A:0.1,B:0.2),(C:0.1,D:0.2));",
  "polytomy": "(A:0.1,B:0.1,C:0.1,D:0.1);"
};

function counts(newick) {
  const all = preorder(readTree(newick));
  const tipCount = all.filter((n) => n.children.length === 0).length;
  return { tipCount, nodeCount: all.length };
}

// rect/radial only draw a <circle> per tip; unrooted draws one per node
// (internal nodes get r=0), so the expected count differs by layout.
const expectedCircles = {
  rect: (c) => c.tipCount,
  radial: (c) => c.tipCount,
  unrooted: (c) => c.nodeCount
};

for (const layout of ["rect", "radial", "unrooted"]) {
  for (const [name, newick] of Object.entries(cases)) {
    test(`drawPhylogeny renders all tips as circles [${layout}] ${name}`, () => {
      const svg = drawPhylogeny(newick, { layout, width: 400, height: 400 });
      const circles = svg.querySelectorAll("circle");
      assert.equal(circles.length, expectedCircles[layout](counts(newick)));
    });
  }
}

test("radial layout requires width === height", () => {
  assert.throws(
    () => drawPhylogeny("(A:0.1,B:0.2);", { layout: "radial", width: 400, height: 300 }),
    /width and height must be the same/
  );
});

test("rejects an unsupported layout name", () => {
  assert.throws(
    () => drawPhylogeny("(A:0.1,B:0.2);", { layout: "bogus" }),
    /Unsupported layout/
  );
});

test("highlightTips draws an extra static path by tip label", () => {
  const withoutHighlight = drawPhylogeny("((A:0.1,B:0.2):0.3,C:0.4);", {
    layout: "rect",
    width: 400,
    height: 400
  });
  const withHighlight = drawPhylogeny("((A:0.1,B:0.2):0.3,C:0.4);", {
    layout: "rect",
    width: 400,
    height: 400,
    highlightTips: ["A"]
  });
  const staticLines = (svg) => svg.querySelectorAll(".phylo_static_highlight line").length;
  assert.equal(staticLines(withoutHighlight), 0);
  assert.ok(staticLines(withHighlight) > 0);
});

for (const layout of ["rect", "radial", "unrooted"]) {
  test(`labelFontSize controls tip label text size [${layout}]`, () => {
    const svg = drawPhylogeny("((A:0.1,B:0.2):0.3,C:0.4);", {
      layout,
      width: 400,
      height: 400,
      labelFontSize: 22
    });
    const labels = svg.querySelectorAll(".phylo_labels text");
    assert.ok(labels.length > 0);
    labels.forEach((el) => assert.equal(el.getAttribute("font-size"), "22"));
  });
}
