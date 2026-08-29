import { test } from "node:test";
import assert from "node:assert/strict";
import readTree from "../src/utils/readTree.js";
import toNewick from "../src/utils/toNewick.js";
import randomTree from "../src/utils/randomTree.js";
import { preorder } from "../src/utils/preorder.js";

function tips(tree) {
  return [...preorder(tree)].filter((n) => n.children.length === 0);
}

test("round-trips a newick string through readTree -> toNewick -> readTree", () => {
  const original = "((A:0.1,B:0.2):0.3,(C:0.15,(D:0.1,E:0.2):0.1):0.2):0;";
  const tree = readTree(original);
  const reparsed = readTree(toNewick(tree));
  assert.deepEqual(
    tips(reparsed).map((n) => n.label).sort(),
    tips(tree).map((n) => n.label).sort()
  );
});

test("serializes a random tree into valid, parseable newick", () => {
  const tree = randomTree(10, { seed: 5 });
  const newick = toNewick(tree);
  assert.ok(newick.endsWith(";"));
  const reparsed = readTree(newick);
  assert.deepEqual(
    tips(reparsed).map((n) => n.label).sort(),
    tips(tree).map((n) => n.label).sort()
  );
});

test("omits branch length when null", () => {
  const tree = readTree("A;");
  assert.equal(toNewick(tree), "A;");
});
