import { test } from "node:test";
import assert from "node:assert/strict";
import readTree from "../src/utils/readTree.js";
import rectangleLayout from "../src/rectangle/rectangleLayout.js";
import radialLayout from "../src/radial/radialLayout.js";
import unrooted from "../src/unrooted/unrooted.js";

// Representative newick shapes a real user is likely to paste in, including
// the internal-node-without-label-or-branch-length shape that used to break
// rectangleLayout entirely (see tests/readTree.test.js).
const cases = {
  "branch lengths everywhere": {
    newick: "((A:0.1,B:0.2):0.3,(C:0.15,(D:0.1,E:0.2):0.1):0.2):0.0;",
    tips: ["A", "B", "C", "D", "E"]
  },
  "no branch lengths at all": {
    newick: "((A,B),(C,D));",
    tips: ["A", "B", "C", "D"]
  },
  "tip branch lengths only (no internal branch lengths)": {
    newick: "((A:0.1,B:0.2),(C:0.1,D:0.2));",
    tips: ["A", "B", "C", "D"]
  },
  "polytomy": {
    newick: "(A:0.1,B:0.1,C:0.1,D:0.1);",
    tips: ["A", "B", "C", "D"]
  },
  "internal clade labels": {
    newick: "((A:0.1,B:0.2)X:0.3,C:0.4)ROOT;",
    tips: ["A", "B", "C"]
  }
};

for (const [name, { newick, tips }] of Object.entries(cases)) {
  test(`rectangleLayout renders every tip: ${name}`, () => {
    const tree = readTree(newick);
    const rl = rectangleLayout(tree);
    const rendered = rl.horizontal_lines.filter((d) => d.isTip).map((d) => d.thisLabel).sort();
    assert.deepEqual(rendered, [...tips].sort());
  });

  test(`radialLayout renders every tip: ${name}`, () => {
    const tree = readTree(newick);
    const rad = radialLayout(tree);
    const rendered = rad.data.filter((d) => d.isTip).map((d) => d.thisLabel).sort();
    assert.deepEqual(rendered, [...tips].sort());
  });

  test(`unrooted renders every tip: ${name}`, () => {
    const tree = readTree(newick);
    const u = unrooted(tree);
    const rendered = u.data.filter((d) => d.isTip).map((d) => d.thisLabel).sort();
    assert.deepEqual(rendered, [...tips].sort());
  });
}
