import { test } from "node:test";
import assert from "node:assert/strict";
import readTree from "../src/utils/readTree.js";
import ladderize from "../src/utils/ladderize.js";
import rotate from "../src/utils/rotate.js";
import { preorder } from "../src/utils/preorder.js";

function tipOrder(tree) {
  return preorder(tree)
    .filter((n) => n.children.length === 0)
    .map((n) => n.label);
}

test("ladderize (ascending) puts the smaller clade first at each split", () => {
  // ((A,B),(C,(D,E))) — right clade has 3 tips, left has 2
  const tree = readTree("((A,B),(C,(D,E)));");
  ladderize(tree);
  assert.deepEqual(tipOrder(tree), ["A", "B", "C", "D", "E"]);
});

test("ladderize (descending) puts the larger clade first, recursively", () => {
  const tree = readTree("((A,B),(C,(D,E)));");
  ladderize(tree, { ascending: false });
  // root: (C,(D,E)) [3 tips] before (A,B) [2 tips]; within that clade,
  // (D,E) [2 tips] before C [1 tip]
  assert.deepEqual(tipOrder(tree), ["D", "E", "C", "A", "B"]);
});

test("ladderize mutates and returns the same tree", () => {
  const tree = readTree("((C,(D,E)),(A,B));");
  const result = ladderize(tree);
  assert.equal(result, tree);
});

test("rotate reverses child order at the root by default", () => {
  const tree = readTree("((A,B),(C,D));");
  rotate(tree);
  assert.deepEqual(tipOrder(tree), ["C", "D", "A", "B"]);
});

test("rotate reverses child order at a specific node id", () => {
  const tree = readTree("((A,B),(C,D));");
  const firstClade = tree.children[0]; // (A,B)
  rotate(tree, firstClade.id);
  assert.deepEqual(tipOrder(tree), ["B", "A", "C", "D"]);
});

test("rotate throws for an unknown node id", () => {
  const tree = readTree("(A,B);");
  assert.throws(() => rotate(tree, 9999), /No node with id/);
});
