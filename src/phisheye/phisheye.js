// Based on the archived d3 fisheye plugin, modernized & hardened.
// - Works in screen/pixel space (set xscale/yscale).
// - O(1) math with precomputed constants; avoids unnecessary sqrt.
// - Stable API: .radius(), .distortion(), .focus(), .scales()
// - Returns { x, y, z } where z ~= local magnification (clamped).
// - Adds small ergonomics: .setScales(), .focusFromEvent(), .clampZ()

const phisheye = {
  circular: () => {
    let radius = 200;        // pixels
    let distortion = 2;      // dimensionless
    let focus = [0, 0];      // [fx, fy] in pixels
    let scales = {};         // { xscale, yscale }
    let k0 = 0, k1 = 0;      // precomputed factors
    let radius2 = radius * radius;
    let zClamp = 10;         // max z (magnification) for stability

    function ensureScales() {
      if (!scales || typeof scales.xscale !== "function" || typeof scales.yscale !== "function") {
        throw new Error("phisheye.circular: call .scales(xscale, yscale) before using the fisheye.");
      }
    }

    function rescale() {
      // Same functional form as the classic plugin:
      // k = ((e^d) / (e^d - 1)) * R * (1 - exp(-d * r / R)) / r
      // where d=distortion, R=radius, r=distance to focus.
      const e = Math.exp(distortion);
      k0 = (e / (e - 1)) * radius;  // constant multiplier
      k1 = distortion / radius;     // exponent scale
      radius2 = radius * radius;
      return fisheye;
    }

    function fisheye(d) {
      ensureScales();

      const x0 = scales.xscale(d.x);
      const y0 = scales.yscale(d.y);

      const dx = x0 - focus[0];
      const dy = y0 - focus[1];
      const dd2 = dx * dx + dy * dy;

      // At the focus or outside radius -> identity mapping, z ~ 1
      if (dd2 === 0 || dd2 >= radius2) {
        return { x: x0, y: y0, z: dd2 >= radius2 ? 1 : zClamp };
      }

      const dd = Math.sqrt(dd2);
      // Classic mapping (with a slight blend for gentler core)
      const k = ((k0 * (1 - Math.exp(-dd * k1))) / dd) * 0.75 + 0.25;

      // New position
      const x = focus[0] + dx * k;
      const y = focus[1] + dy * k;

      // Local magnification proxy (clamped)
      const z = Math.min(k, zClamp);

      return { x, y, z };
    }

    // --- Public API ---

    fisheye.radius = function(_) {
      if (!arguments.length) return radius;
      radius = Math.max(0, +_);
      return rescale();
    };

    fisheye.distortion = function(_) {
      if (!arguments.length) return distortion;
      distortion = Math.max(0, +_);
      return rescale();
    };

    fisheye.focus = function(_) {
      if (!arguments.length) return focus.slice();
      if (!Array.isArray(_) || _.length !== 2) throw new Error("focus expects [x, y] in pixels.");
      focus = [+_[0], +_[1]];
      return fisheye;
    };

    fisheye.scales = function(xscale, yscale) {
      if (!arguments.length) return scales;
      scales = { xscale, yscale };
      return fisheye;
    };

    // Convenience alias
    fisheye.setScales = fisheye.scales;

    // Clamp maximum z (magnification) returned; defaults to 10
    fisheye.clampZ = function(_) {
      if (!arguments.length) return zClamp;
      zClamp = Math.max(1, +_);
      return fisheye;
    };

    // Convenience: set focus from a pointer event relative to an HTMLElement/SVG
    // Example: svg.on("pointermove", (e) => fe.focusFromEvent(e, svg.node()))
    fisheye.focusFromEvent = function(event, element) {
      const rect = element.getBoundingClientRect();
      const fx = event.clientX - rect.left;
      const fy = event.clientY - rect.top;
      return fisheye.focus([fx, fy]);
    };

    return rescale();
  }
};

export default phisheye;

