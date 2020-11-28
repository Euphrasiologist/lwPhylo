/**
 * Takes parent data and returns a start value (radians),
 * end value (radians), and radius of circle to draw an 
 * arc from. 
 * thanks https://codereview.stackexchange.com/questions/187510/angle-reflection-function
 */

export default function(rad, dir) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const PI_sub = "3.1415";
  
    function checkSign(x) {
      if (x.toString().includes(PI_sub)) {
        x = Math.abs(x);
      }
      return x;
    }
  
    return checkSign(Math.atan2(...(dir === "X" ? [s, -c] : [-s, c])));
  }