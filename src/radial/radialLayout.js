import radialData from "./radialData.js"
import getRadii from "./getRadii.js"
import getArcs from "./getArcs.js"
import getChildArcs from "./getChildArcs.js"
import fanAngles from "./fanAngles.js";
import getArcsFan from "./getArcsFans.js";
import fortify from "../utils/fortify.js"

/**
 * Simple wrapper for radial layout:
 *  - data: per-node { angle, r, x, y, ... }
 *  - radii: per-edge radial spokes (parent.r → child.r)
 *  - arcs: per-parent arcs spanning all children at parent's radius
 *  - child_arcs: per-child half-arcs (parent.angle → child.angle) at parent's radius
 */
export default function radialLayout(node, opts =  {}) {
  const data = {};
  data.data = radialData(node);
  data.radii = getRadii(node);
  data.arcs = getArcs(data.data);
  data.child_arcs = getChildArcs(data.data);

  const pd = fortify(node, true);
  const angleMap = fanAngles(pd, {
    openAngleDeg: opts.openAngleDeg ?? 0,
    rotateDeg: opts.rotateDeg ?? 0
  });

  // stamp angles + x,y back onto pd (r stays your cumulative edge length)
  for (const d of pd) {
    d.angle = angleMap.get(d.thisId) ?? 0;
    d.x = d.r * Math.cos(d.angle);
    d.y = d.r * Math.sin(d.angle);
  }

  data.data_pd = pd;
  data.arcs_fan = getArcsFan(pd);

  return data;
}

