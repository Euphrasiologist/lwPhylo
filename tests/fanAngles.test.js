import { test } from "node:test";
import assert from "node:assert/strict";
import readTree from "../src/utils/readTree.js";
import radialLayout from "../src/radial/radialLayout.js";

const TAU = Math.PI * 2;
const norm = (t) => ((t % TAU) + TAU) % TAU;

// A lone tip then a left-deep comb: the comb's angle sits next to its last tip,
// so the inner parent's children span more than 180°. The outgroup keeps that
// parent off the root, where r > 0 and getArcsFan draws its arc.
const comb = "((((((B:1,C:1):1,D:1):1,E:1):1,F:1):1,G:1):1,H:1)";
const unbalanced = `(O:1,(A:1,${comb}:1):1);`;

// Every parent must lie on the CCW arc from its first child to its last child
function arcEscapes(data) {
  const byId = new Map(data.map((d) => [d.thisId, d]));
  return data.filter((p) => {
    const c = p.children || [];
    if (c.length < 2) return false;
    const start = byId.get(c[0]).angle;
    const end = byId.get(c[c.length - 1]).angle;
    return norm(p.angle - start) > norm(end - start) + 1e-9;
  });
}

test("the unbalanced fixture has a non-root parent spanning over 180°", () => {
  const { arcs } = radialLayout(readTree(unbalanced), { openAngleDeg: 14 });
  assert.ok(arcs.some((a) => a.largeArc === 1));
});

for (const opts of [
  { openAngleDeg: 0 },
  { openAngleDeg: 14 },
  { openAngleDeg: 14, rotateDeg: 90 },
  { openAngleDeg: 14, rotateDeg: 300 },
  { openAngleDeg: 14, rotateDeg: -37 }
]) {
  test(`fan layout keeps every parent within its child arc: ${JSON.stringify(opts)}`, () => {
    const { data, arcs } = radialLayout(readTree(unbalanced), opts);
    assert.deepEqual(arcEscapes(data), []);

    // The drawn arcs agree with the node angles
    const byId = new Map(data.map((d) => [d.thisId, d]));
    for (const a of arcs) {
      const delta = norm(a.end - a.start);
      assert.ok(norm(byId.get(a.thisId).angle - a.start) <= delta + 1e-9);
    }
  });
}

test("fan layout angles stay in [0, 2π) under rotation", () => {
  const { data } = radialLayout(readTree(unbalanced), { rotateDeg: -37 });
  for (const d of data) assert.ok(d.angle >= 0 && d.angle < TAU);
});
