/**
 * Legacy shim: normalize angle to [0, 2π).
 * The new radial code does not need geometric reflections;
 * it uses circular spans and atan2.
 */
export default function reflectAngle(rad /*, dir */) {
  const TAU = Math.PI * 2;
  return ((rad % TAU) + TAU) % TAU;
}

