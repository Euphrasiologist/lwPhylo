/*
* It's on my TODO list to split all branches in half
* so they can be highlighted separately later in the plot.
* Find the mid point of two angles in radians
* there are some subtleties I don't fully understand
* e.g. if the start/end angles are equal to pi, the sign must be flipped.
*/


export default function (start, end) {
  // if the angles are exactly equal but opposite
  // return Math.PI (else undefined is returned...)
  if (
    Math.sign(start) !== Math.sign(end) &&
    Math.abs(start) === Math.abs(end)
  ) {
    return Math.PI;
  }

  // calculate the average sin and cosine for the angles
  const X = (Math.cos(start) + Math.cos(end)) / 2,
    Y = (Math.sin(start) + Math.sin(end)) / 2;

  const signX = Math.sign(X),
    signY = Math.sign(Y);

  var meanAngle;
  // adjustments for the sign of each of X, Y
  if (signX === 1 && signY === 1) {
    meanAngle = Math.atan(Y / X);
  } else if (signX === 1 && signY === -1) {
    meanAngle = 2 * Math.PI - Math.atan(Y / X);
  } else if (signX === -1 && signY === 1) {
    meanAngle = Math.PI - Math.atan(Y / X);
  } else if (signX === -1 && signY === -1) {
    meanAngle = Math.PI + Math.atan(Y / X);
  }

  // if the start or end angles are equal to PI (or close approximations)
  // flip the sign.
  return start.toString().indexOf("3.14159") > -1 ||
    end.toString().indexOf("3.14159") > -1
    ? -meanAngle
    : meanAngle;
}