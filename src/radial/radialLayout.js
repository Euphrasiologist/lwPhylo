import radialData from "./radialData.js"
import getRadii from "./getRadii.js"
import getArcs from "./getArcs.js"

/**
 * Simple wrapper function for getting the data,
 * radii, and arcs.
 */

export default function (node) {
  var data = {};

  // TODO: does radial_data need to be printed out?
  data.data = radialData(node);
  data.radii = getRadii(node);
  data.arcs = getArcs(data.data);

  return data;
}