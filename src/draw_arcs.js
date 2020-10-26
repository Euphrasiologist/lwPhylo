/**
 * Describe the arc to draw
 * https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
 * @param {number} x
 * @param {number} x
 * @param {number} radius
 * @param {number} startAngle
 * @param {number} endAngle
 */

function describeArc(x, y, radius, startAngle, endAngle) {

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

/**
 * Convert polar co-ordinates to cartesian
 * https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {number} angleInRadians
 */

function polarToCartesian(centerX, centerY, radius, angleInRadians) {
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}