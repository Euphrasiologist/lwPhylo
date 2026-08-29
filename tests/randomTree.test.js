import { test } from "node:test";
import assert from "node:assert/strict";
import randomTree from "../src/utils/randomTree.js";
import { preorder } from "../src/utils/preorder.js";

function nodes(tree) {
  return [...preorder(tree)];
}

function tips(tree) {
  return nodes(tree).filter((n) => n.children.length === 0);
}

test("generates the requested number of tips", () => {
  const tree = randomTree(8);
  assert.equal(tips(tree).length, 8);
});

test("every node gets a unique id and correct parent/child links", () => {
  const tree = randomTree(12, { seed: 42 });
  const all = nodes(tree);
  const ids = all.map((n) => n.id);
  assert.equal(new Set(ids).size, all.length);
  for (const n of all) {
    if (n.parent) assert.ok(n.parent.children.includes(n));
  }
});

test("root has null parent and null branch length", () => {
  const tree = randomTree(5);
  assert.equal(tree.parent, null);
  assert.equal(tree.branchLength, null);
});

test("all non-root nodes get a non-negative branch length under maxBranchLength", () => {
  const tree = randomTree(15, { maxBranchLength: 2.5, seed: 7 });
  for (const n of nodes(tree)) {
    if (n.parent) {
      assert.ok(n.branchLength >= 0 && n.branchLength < 2.5);
    }
  }
});

test("tips get unique, prefixed labels", () => {
  const tree = randomTree(6, { labelPrefix: "tip" });
  const labels = tips(tree).map((n) => n.label).sort();
  assert.deepEqual(labels, ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"]);
});

test("is a strictly bifurcating tree for nTips > 1", () => {
  const tree = randomTree(20, { seed: 1 });
  for (const n of nodes(tree)) {
    assert.ok(n.children.length === 0 || n.children.length === 2);
  }
});

test("same seed produces the same topology and branch lengths", () => {
  const a = randomTree(10, { seed: 123 });
  const b = randomTree(10, { seed: 123 });
  const flatten = (n) => [n.label, n.branchLength, ...n.children.map(flatten)];
  assert.deepEqual(flatten(a), flatten(b));
});

test("handles a single tip", () => {
  const tree = randomTree(1);
  assert.equal(tree.children.length, 0);
  assert.equal(tree.label, "t1");
});

test("rejects invalid nTips", () => {
  assert.throws(() => randomTree(0));
  assert.throws(() => randomTree(-3));
  assert.throws(() => randomTree(1.5));
});
