// based on https://github.com/d3/d3-plugins/blob/master/fisheye/fisheye.js
// now archived d3 code?

const phisheye = {
    circular: () => {
        var radius = 200,
            distortion = 2,
            k0,
            k1,
            focus = [0, 0],
            scales = {};

        function fisheye(d) {
            var dx = scales.xscale(d.x) - focus[0],
                dy = scales.yscale(d.y) - focus[1],
                dd = Math.sqrt(dx * dx + dy * dy);
            if (!dd || dd >= radius)
                return {
                    x: scales.xscale(d.x),
                    y: scales.yscale(d.y),
                    z: dd >= radius ? 1 : 10
                };
            var k = ((k0 * (1 - Math.exp(-dd * k1))) / dd) * .75 + .25;
            return {
                x: focus[0] + dx * k,
                y: focus[1] + dy * k,
                z: Math.min(k, 10)
            };
        }

        function rescale() {
            k0 = Math.exp(distortion);
            k0 = (k0 / (k0 - 1)) * radius;
            k1 = distortion / radius;
            return fisheye;
        }

        fisheye.radius = function (_) {
            if (!arguments.length) return radius;
            radius = +_;
            return rescale();
        };

        fisheye.distortion = function (_) {
            if (!arguments.length) return distortion;
            distortion = +_;
            return rescale();
        };

        fisheye.focus = function (_) {
            if (!arguments.length) return focus;
            focus = _;
            return fisheye;
        };

        fisheye.scales = function (_, __) {
            if (!arguments.length) return scales;
            scales = {
                xscale: _,
                yscale: __
            };
            return fisheye;
        };

        return rescale();
    }
}

export default phisheye