//import {numTips, fortify} from "./utils.js"

/**
 * Simple wrapper function for getting the data,
 * radii, and arcs.
 * @param {object} node
 */

function radialLayout(node){
    var data = {};
  
  data.radii = get_radii(node);
  // TODO: does radial_data need to be printed out?
  data.data = radial_data(node);
  data.arcs = get_arcs(data.data);
  
  return data;
}

/**
 * Takes parent data and returns a start value (radians),
 * end value (radians), and radius of circle to draw an 
 * arc from
 * @param {object} pd
 */

function get_arcs(pd){
    // must return start of arc and end
    // these are pairs of edges that have the same parent
    // start is the min(angle) of the children and end is the max(angle)
    // radius is the radius of the parent
    // origin is 0, 0 
    
    var data = [];
    var root = pd.map(d => d.parentId === null ? d.thisId:null).filter(d => d != null)[0];
    
    
      // get the branchlength of the parentID
    function sister_angle(current_parentId){
      for(var i=0; i<pd.length; i++){
        if(pd[i].parentId === current_parentId){
            var sister_angle = pd[i].angle;
        }
      }
      return sister_angle;
    }
    
    function parent_radius(current_parentId){
      for(var i=0; i<pd.length; i++){
        if(pd[i].thisId === current_parentId){
            var parent_r = pd[i].r;
        }
      }
      return parent_r;
    }
    
    for(var i=0; i<pd.length; i++){
      if(pd[i].thisId !== root){
          data.push({
                'start': reflectAngle(Math.min(pd[i].angle, sister_angle(pd[i].parentId)), "Y"),
                'end':  reflectAngle(Math.max(pd[i].angle, sister_angle(pd[i].parentId)), "Y"),
                'radius': parent_radius(pd[i].parentId),
                'thisId': pd[i].thisId,
                'parentId': pd[i].parentId
          
          })
      }
    }
    //  TODO: understand why this works (and it may not in every case)... test!
    for(var i=0; i<data.length; i++){
      if(Math.sign(data[i].start) !== Math.sign(data[i].end)){
        data[i].end = Math.abs(data[i].end);
        data[i].start = -Math.abs(data[i].start);
    }
}

return data.filter(d => d.start !== d.end & d.radius !== 0);
    
}

/**
 * Takes parent data and returns a start value (radians),
 * end value (radians), and radius of circle to draw an 
 * arc from. 
 * thanks https://codereview.stackexchange.com/questions/187510/angle-reflection-function
 * @param {number} rad 
 * @param {string} dir
 */

function reflectAngle(rad, dir) {
    const c = Math.cos(rad), s = Math.sin(rad);
    const PI_sub = "3.1415";
    
    function check_sign(x){
      if(x.toString().includes(PI_sub)){
      x = Math.abs(x);
    }
      return x;
    }
  
    return check_sign(Math.atan2(...(dir === "X" ? [s, -c] : [-s, c])));
}

/**
 * Take a parsed tree and get the radii of each of the nodes.
 * @param {object} node
 */

function get_radii(node){
    var data = radial_data(node);
    
    // for the current iteration of the loop find the matching parentId
    function get_radius(current_node){
      for(var i=0; i < data.length; i++){
        if(data[i].thisId === current_node.parentId){
          var radius = data[i].r;
        }
      }
      return radius;
    }
    
    var arcs = [];
    // find root
    var root = data.map(d => d.parentId === null ? d.thisId:null).filter(d => d != null)[0];
    
    for(var i=0; i < data.length; i++){
      if(data[i].thisId !== root){
        
        arcs.push({
                  'thisId': data[i].thisId,
                  'thisLabel': data[i].thisLabel,
                  'x0': data[i].x,
                  // radius of the parent * cos(angle)
                  'x1': get_radius(data[i])*Math.cos(data[i].angle),
                  'y0': data[i].y,
                  // radius of the parent * sin(angle)
                  'y1': get_radius(data[i])*Math.sin(data[i].angle),
                  'isTip': data[i].isTip
              })
  
      }
    }
  
    
    return arcs;
    
  }

/**
 * Take a parsed tree and get the important data from them (i.e. radii, arcs).
 * @param {object} node
 */

  function radial_data(node){
    // should start out the same as get_horizontal
    // it's very similar in fact, but keeping separate for clarity.
    var pd = fortify(node);
    
    var tip_number = numTips(node);
    
    // make tip angles
    var tipID = 1;
    for(var i=0; i<pd.length; i++){
      if(pd[i].isTip == true){
         pd[i].angle = (tipID/tip_number)*2*Math.PI;
         tipID += 1;
      }
    }
    
      // probably incredibly inefficient for large trees.
    // gets the y values of two child branches by looping through the whole tree...
    function internal_node_angle(child_1, child_2){
      for(var i=0; i<pd.length; i++){
        if(pd[i].thisId === child_1){
          var angle_1 = pd[i].angle;
        }
        if(pd[i].thisId === child_2){
          var angle_2 = pd[i].angle;
        }
      }
      // https://stackoverflow.com/questions/29544371/finding-the-average-of-an-array-using-js
      // just to eliminate d3 dependency here.
      function average(array){ 
        var mean = array.reduce((a, b) => a + b) / array.length
        return mean
      }
      return average([angle_1, angle_2]);
    }
    
    // if the node is not a tip...
    for (var i=0; i<pd.length; i++){
      if(pd[i].isTip === false){
        // then y0 === y1 and is the mean of the parental nodes
         pd[i].angle = internal_node_angle(pd[i].children[0], pd[i].children[1]);
      } 
    }
    
    // find root
    var root = pd.map(d => d.parentId === null ? d.thisId:null).filter(d => d != null)[0];
    
    // sort the data temporarily in decreasing parentId
    pd.sort((a,b) => b.thisId - a.thisId);
  
    // get the branchlength of the parentID
    function get_parent_branchLength(current_parentId){
      for(var i=0; i<pd.length; i++){
        if(pd[i].thisId === current_parentId){
            var branchLength = pd[i].r;
        }
      }
      return branchLength;
    }
  
    // assign depths (branch lengths) to radii
    for (var i=0; i<pd.length; i++){
      // special cases where parent is the root.
      if(pd[i].parentId === root){
        
        if(pd[i].isTip === true){
        // radius is branch length at root?
         pd[i].r = pd[i].branchLength;
         pd[i].x = pd[i].branchLength;
         pd[i].y = 0;
          
        } else { // it's a node
        // radius is branch length at root?
         pd[i].r = pd[i].branchLength;
         pd[i].x = pd[i].branchLength*Math.cos(pd[i].angle);
         pd[i].y = pd[i].branchLength*Math.sin(pd[i].angle);
        }
        
      } else {
        // the x0 is that of the parent
        var parent_branchLength = get_parent_branchLength(pd[i].parentId);
        // the x1 is the sum of parent and current branchlength
        pd[i].r = parent_branchLength + pd[i].branchLength;
        // at the same time we can make x and y from polar coordinates
        // this is creating some NaN's, may cause problems later.
        pd[i].x = (parent_branchLength + pd[i].branchLength)*Math.cos(pd[i].angle);
        pd[i].y = (parent_branchLength + pd[i].branchLength)*Math.sin(pd[i].angle);
      }
    }
     
    // at this point the first element is the root
    pd[0].r = 0;
    pd[0].x = 0;
    pd[0].y = 0;
    
    // return the original sorted data
    //pd.sort((a,b) => a.thisId - b.thisId)
    
    return pd;
  }