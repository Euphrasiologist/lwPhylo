import polarToCartesian from "./polarToCartesian.js"

/**
 * Describe the arc to draw
 * https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
 */

export default function (x, y, radius, startAngle, endAngle) {

  var start = polarToCartesian(x, y, radius, startAngle);
  var end = polarToCartesian(x, y, radius, endAngle);

  // TODO: refers to middle zero below... but no large arcs needed..?
  // var largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  var d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, 0, 0, end.x, end.y
  ].join(" ");

  return d;
}