import edges from "../utils/edges.js";
import fortify from "../utils/fortify.js";
import equalAngleLayout from "./equalAngleLayout.js";

/**
 * Simple wrapper function for equalAngleLayout()
 */

export default function (node) {
  var data = {};
  // use the Felsenstein equal angle layout algorithm
  var eq = fortify(equalAngleLayout(node));
  data.data = eq;
  // make the edges dataset
  data.edges = edges(eq);

  return data;
}