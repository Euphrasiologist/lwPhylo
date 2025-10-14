/**
 * Convert polar coordinates (radians) to cartesian (screen space).
 * NOTE: Invert Y so angles increase counter-clockwise on screen,
 * matching how you plot points with yScaleRadial (range [h,0]).
 */
export default function (centerX, centerY, radius, angleInRadians) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY - radius * Math.sin(angleInRadians) // <- was + ; now -
  };
}

