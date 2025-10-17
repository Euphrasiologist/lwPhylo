import radialData from "./radialData.js"
import getRadii from "./getRadii.js"
import getArcs from "./getArcs.js"
import getChildArcs from "./getChildArcs.js"

/**
 * Simple wrapper for radial layout:
 *  - data: per-node { angle, r, x, y, ... }
 *  - radii: per-edge radial spokes (parent.r → child.r)
 *  - arcs: per-parent arcs spanning all children at parent's radius
 *  - child_arcs: per-child half-arcs (parent.angle → child.angle) at parent's radius
 */
export default function radialLayout(node) {
  const data = {};
  data.data = radialData(node);
  data.radii = getRadii(node);
  data.arcs = getArcs(data.data);
  data.child_arcs = getChildArcs(data.data);
  return data;
}

