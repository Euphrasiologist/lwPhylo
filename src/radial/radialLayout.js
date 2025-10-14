import radialData from "./radialData.js"
import getRadii from "./getRadii.js"
import getArcs from "./getArcs.js"

/**
 * Simple wrapper for radial layout:
 *  - data: per-node { angle, r, x, y, ... }
 *  - radii: per-edge radial spokes (parent.r → child.r)
 *  - arcs: per-internal-node arcs spanning its children at parent radius
 */
export default function radialLayout(node) {
  const data = {};
  data.data = radialData(node);
  data.radii = getRadii(node);
  data.arcs = getArcs(data.data);
  return data;
}

