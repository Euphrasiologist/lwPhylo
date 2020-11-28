import getHorizontal from "./getHorizontal.js"
import getVertical from "./getVertical.js"

/**
 * Simple wrapper for rectangle layout functions
 */

export default function(node) {
    var data = {};
  
    data.data = getHorizontal(node); // horizontal_lines
    data.vertical_lines = getVertical(node);
  
    return data;
  }