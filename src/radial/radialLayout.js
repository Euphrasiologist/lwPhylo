// src/radial/radialLayout.js
import radialData from "./radialData.js";
import getRadii from "./getRadii.js";
import getRadiiFromPd from "./getRadiiFromPd.js";
import getArcs from "./getArcs.js";            // your existing "shortest-arc"
import getArcsFan from "./getArcsFan.js";      // new
import fanAngles from "./fanAngles.js";
import getChildArcs from "./getChildArcs.js";  // optional existing helper
import getChildArcsFan from "./getChildArcsFan.js";  // optional existing helper

/**
 * radialLayout(node, opts?)
 * opts:
 *   - angleStrategy: "cmean" (default, your current) | "fan" (APE-like)
 *   - arcsStyle:     "shortest" (default) | "fan" (block arcs, supports wrap)
 *   - openAngleDeg:  number (gap wedge for "fan" angles)
 *   - rotateDeg:     number (rotation for "fan" angles)
 */
export default function radialLayout(node, opts = {}) {
  const {
    // default fan
    angleStrategy = "fan",
    arcsStyle = "fan",
    openAngleDeg = 0,
    rotateDeg = 0
  } = opts;

  // Start with your current enriched nodes (angle + r from radialData)
  const pd = radialData(node);

  if (angleStrategy === "fan") {
    // overwrite angles with APE-like fan angles; keep radii r as-is
    const angleMap = fanAngles(pd, { openAngleDeg, rotateDeg });
    for (const d of pd) {
      const a = angleMap.get(d.thisId);
      if (a != null) {
        d.angle = a;
        d.x = d.r * Math.cos(a);
        d.y = d.r * Math.sin(a);
      }
    }
  }

  // Build spokes using the angles currently on pd
  const radii = (angleStrategy === "fan")
    ? getRadiiFromPd(pd)
    : getRadii(node);

  // Choose arc builder
  const arcs = (arcsStyle === "fan")
    ? getArcsFan(pd)
    : getArcs(pd);

  // per-child arcs for half-arc highlighting if you already use them
  let child_arcs = [];
  if (opts.arcsStyle === "fan") {
    child_arcs = getChildArcsFan(data);
  } else {
    child_arcs = getChildArcs(data);
  }

  return { data: pd, radii, arcs, child_arcs };
}

