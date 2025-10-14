/*
* It's on my TODO list to split all branches in half
* so they can be highlighted separately later in the plot.
* Find the mid point of two angles in radians
* there are some subtleties I don't fully understand
* e.g. if the start/end angles are equal to pi, the sign must be flipped.
*/

export default function meanAngle(a, b) {
  // normalize to [0, 2pi)
  const norm = (θ) => (θ % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
  a = norm(a); b = norm(b);

  // handle wraparound by averaging unit vectors
  const X = (Math.cos(a) + Math.cos(b)) / 2;
  const Y = (Math.sin(a) + Math.sin(b)) / 2;
  if (X === 0 && Y === 0) return 0; // opposite directions, arbitrary
  return norm(Math.atan2(Y, X));
}

