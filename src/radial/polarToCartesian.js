// src/radial/polarToCartesian.js
export default function (cx, cy, r, t) {
  return { x: cx + r * Math.cos(t), y: cy - r * Math.sin(t) };
}
