import radialData from "./radialData.js"

/**
 * Take a parsed tree and get the radii of each of the nodes.
 */

export default function(node) {
    var data = radialData(node);
  
    // for the current iteration of the loop find the matching parentId
    function getRadius(current_node) {
      for (var i = 0; i < data.length; i++) {
        if (data[i].thisId === current_node.parentId) {
          var radius = data[i].r;
        }
      }
      return radius;
    }
  
    var arcs = [];
    // find root
    var root = data.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];
  
    for (var i = 0; i < data.length; i++) {
      if (data[i].thisId !== root) {
  
        arcs.push({
          'thisId': data[i].thisId,
          'thisLabel': data[i].thisLabel,
          'x0': data[i].x,
          // radius of the parent * cos(angle)
          'x1': getRadius(data[i]) * Math.cos(data[i].angle),
          'y0': data[i].y,
          // radius of the parent * sin(angle)
          'y1': getRadius(data[i]) * Math.sin(data[i].angle),
          'isTip': data[i].isTip
        })
      }
    }
  
    return arcs;
  
  }