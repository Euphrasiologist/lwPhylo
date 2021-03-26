import reflectAngle from "./reflectAngle.js"

/**
 * Takes parent data and returns a start value (radians),
 * end value (radians), and radius of circle to draw an 
 * arc from
 */

export default function(pd) {
    // must return start of arc and end
    // these are pairs of edges that have the same parent
    // start is the min(angle) of the children and end is the max(angle)
    // radius is the radius of the parent
    // origin is 0, 0 
  
    var data = [];
    var root = pd.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];
  
  
    // get the branchlength of the parentID
    function sisterAngle(current_parentId) {
      for (var i = 0; i < pd.length; i++) {
        if (pd[i].parentId === current_parentId) {
          var sister_angle = pd[i].angle;
        }
      }
      return sister_angle;
    }
  
    function parentRadius(current_parentId) {
      for (var i = 0; i < pd.length; i++) {
        if (pd[i].thisId === current_parentId) {
          var parent_r = pd[i].r;
        }
      }
      return parent_r;
    }
  
    for (let i = 0; i < pd.length; i++) {
      if (pd[i].thisId !== root) {
        data.push({
          'start': reflectAngle(Math.max(pd[i].angle, sisterAngle(pd[i].parentId)), "Y"),
          'end': reflectAngle(Math.min(pd[i].angle, sisterAngle(pd[i].parentId)), "Y"),
          'radius': parentRadius(pd[i].parentId),
          'thisId': pd[i].thisId,
          'parentId': pd[i].parentId
  
        })
      }
    }
    //  TODO: understand why this works (and it may not in every case)... test!
    for (let i = 0; i < data.length; i++) {
      if (Math.sign(data[i].start) !== Math.sign(data[i].end)) {
        data[i].end = Math.abs(data[i].end);
        data[i].start = -Math.abs(data[i].start);
      }
    }
  
    return data.filter(d => d.start !== d.end & d.radius !== 0);
  
  }