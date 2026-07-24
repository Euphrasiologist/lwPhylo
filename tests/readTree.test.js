import { test } from "node:test";
import assert from "node:assert/strict";
import readTree from "../src/utils/readTree.js";
import { preorder } from "../src/utils/preorder.js";

function nodes(tree) {
  return [...preorder(tree)];
}

function tips(tree) {
  return nodes(tree).filter((n) => n.children.length === 0);
}

test("parses a standard newick string with branch lengths", () => {
  const tree = readTree("((A:0.1,B:0.2):0.3,(C:0.15,(D:0.1,E:0.2):0.1):0.2):0.0;");
  assert.deepEqual(tips(tree).map((n) => n.label).sort(), ["A", "B", "C", "D", "E"]);
});

test("every node gets a unique id, even unlabeled internal nodes with no branch length", () => {
  // Regression test: internal (clade) nodes with neither a label nor a branch
  // length used to never receive an `id`, which left their children with a
  // `parentId` of `undefined` and silently dropped them from every
  // downstream layout (most visibly: zero tips rendered by rectangleLayout).
  const tree = readTree("((A,B),(C,D));");
  const all = nodes(tree);
  const ids = all.map((n) => n.id);

  assert.equal(new Set(ids).size, all.length, "all ids must be unique");
  for (const n of all) {
    assert.notEqual(n.id, undefined, `node "${n.label}" must have an id`);
  }
  assert.deepEqual(tips(tree).map((n) => n.label).sort(), ["A", "B", "C", "D"]);
});

test("internal nodes without labels/branch lengths still link parent->child correctly", () => {
  const tree = readTree("((A:0.1,B:0.2),(C:0.1,D:0.2));");
  for (const n of nodes(tree)) {
    if (n.parent) {
      assert.ok(n.parent.children.includes(n));
      assert.notEqual(n.parent.id, undefined);
    }
  }
});

test("tolerates a missing trailing semicolon", () => {
  const tree = readTree("((A:0.1,B:0.2):0.3,C:0.4)");
  assert.deepEqual(tips(tree).map((n) => n.label).sort(), ["A", "B", "C"]);
});

test("handles a single-tip tree", () => {
  const tree = readTree("A;");
  assert.equal(tree.label, "A");
  assert.equal(tree.children.length, 0);
});

test("parses scientific notation and negative branch lengths", () => {
  const tree = readTree("(A:1e-3,B:-2.5e-2);");
  const [a, b] = tree.children;
  assert.equal(a.branchLength, 1e-3);
  assert.equal(b.branchLength, -2.5e-2);
});

test("parses internal node labels (e.g. bootstrap/clade names)", () => {
  const tree = readTree("((A:0.1,B:0.2)X:0.3,C:0.4)ROOT;");
  assert.equal(tree.label, "ROOT");
  assert.equal(tree.children[0].label, "X");
});

test("warns but does not throw on tokens with multiple colons", () => {
  const tree = readTree("(A:0.1:extra,B:0.2);");
  assert.deepEqual(tips(tree).map((n) => n.label).sort(), ["A", "B"]);
});
