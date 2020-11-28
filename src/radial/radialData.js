import fortify from "../utils/index.js"
import numTips from "../utils/index.js"
import mean from "../utils/index.js"

/**
 * Take a parsed tree and get the important data from them (i.e. radii, arcs).
 */

export default function(node) {
    // should start out the same as get_horizontal
    // it's very similar in fact, but keeping separate for clarity.
    var pd = fortify(node);
  
    var tip_number = numTips(node);
  
    // make tip angles
    var tipID = 1;
    for (let i = 0; i < pd.length; i++) {
      if (pd[i].isTip == true) {
        pd[i].angle = (tipID / tip_number) * 2 * Math.PI;
        tipID += 1;
      }
    }
  
    // probably incredibly inefficient for large trees.
    // gets the y values of two child branches by looping through the whole tree...
    function internalNodeAngle(child_1, child_2) {
      for (var i = 0; i < pd.length; i++) {
        if (pd[i].thisId === child_1) {
          var angle_1 = pd[i].angle;
        }
        if (pd[i].thisId === child_2) {
          var angle_2 = pd[i].angle;
        }
      }
      return mean([angle_1, angle_2]); // see utils.js
    }
  
    // if the node is not a tip...
    for (let i = 0; i < pd.length; i++) {
      if (pd[i].isTip === false) {
        // then y0 === y1 and is the mean of the parental nodes
        pd[i].angle = internalNodeAngle(pd[i].children[0], pd[i].children[1]);
      }
    }
  
    // find root
    var root = pd.map(d => d.parentId === null ? d.thisId : null).filter(d => d != null)[0];
  
    // sort the data temporarily in decreasing parentId
    pd.sort((a, b) => b.thisId - a.thisId);
  
    // get the branchlength of the parentID
    function getParentBranchLength(current_parentId) {
      for (var i = 0; i < pd.length; i++) {
        if (pd[i].thisId === current_parentId) {
          var branchLength = pd[i].r;
        }
      }
      return branchLength;
    }
  
    // assign depths (branch lengths) to radii
    for (let i = 0; i < pd.length; i++) {
      // special cases where parent is the root.
      if (pd[i].parentId === root) {
  
        if (pd[i].isTip === true) {
          // radius is branch length at root?
          pd[i].r = pd[i].branchLength;
          pd[i].x = pd[i].branchLength;
          pd[i].y = 0;
  
        } else { // it's a node
          // radius is branch length at root?
          pd[i].r = pd[i].branchLength;
          pd[i].x = pd[i].branchLength * Math.cos(pd[i].angle);
          pd[i].y = pd[i].branchLength * Math.sin(pd[i].angle);
        }
  
      } else {
        // the x0 is that of the parent
        var parent_branchLength = getParentBranchLength(pd[i].parentId);
        // the x1 is the sum of parent and current branchlength
        pd[i].r = parent_branchLength + pd[i].branchLength;
        // at the same time we can make x and y from polar coordinates
        // this is creating some NaN's, may cause problems later.
        pd[i].x = (parent_branchLength + pd[i].branchLength) * Math.cos(pd[i].angle);
        pd[i].y = (parent_branchLength + pd[i].branchLength) * Math.sin(pd[i].angle);
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