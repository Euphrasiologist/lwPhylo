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
export default function getChildArcs(pd) {
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

