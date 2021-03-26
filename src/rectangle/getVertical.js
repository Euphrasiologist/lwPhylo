import getHorizontal from "./getHorizontal.js"

/**
 * Get the vertical lines to draw.
 */

export default function (node) {
  var data = getHorizontal(node);

  // for the current iteration of the loop find the matching parentId
  // then take the difference
  function findPairs(current_node) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].parentId === current_node.parentId) {
        var height = Math.abs(data[i].y0 - current_node.y0);
      }
    }
    return height;
  }

  var verticals = [];
  // find root
  var root = data.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];

  for (var i = 0; i < data.length; i++) {
    if (data[i].thisId !== root) {

      verticals.push({
        'thisId': data[i].thisId,
        'x0': data[i].x0,
        'x1': data[i].x0, // x values remain constant
        'y0': data[i].y0,
        'y1': data[i].y0 + findPairs(data[i]),
        'heights': findPairs(data[i])
      })

    }
  }

  return verticals;
}