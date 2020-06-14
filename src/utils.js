/** Core phylogeny functions to traverse trees and create initial data frames:
* Thanks to Art Poon - https://github.com/ArtPoon/slides
*/


/**
 * Recursive function for pre-order traversal of tree
 * (output parent before children).
 * @param {object} node
 * @param {Array} list An Array of nodes
 * @return An Array of nodes in pre-order
 */

// was exported

function preorder(node, list=[]) {
    list.push(node);
    for (var i=0; i < node.children.length; i++) {
        list = preorder(node.children[i], list);
    }
    return(list);
}

/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 * @param {object} node
 * @param {Array} list An Array of nodes
 * @return An Array of nodes in pre-order
 */

// was exported

function levelorder(root) {
    // aka breadth-first search
    var queue = [root],
        result = [],
        curnode;

    while (queue.length > 0) {
        curnode = queue.pop();
        result.push(curnode);
        for (const child of curnode.children) {
            queue.push(child);
        }
    }
    return(result);
}

/**
 * Count the number of tips that descend from this node
 * @param {object} thisnode
 */

// was exported

function numTips(thisnode) {
    var result = 0;
    for (const node of levelorder(thisnode)) {
        if (node.children.length == 0) result++;
    }
    return(result);
}

/**
 * Convert parsed Newick tree from readTree() into data
 * frame.
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 * @param {object} tree Return value of readTree
 * @return Array of Objects
 */

// was exported

function fortify(tree, sort=true) {
    var df = [];

    for (const node of preorder(tree)) {
        if (node.parent === null) {
            df.push({
                'parentId': null,
                'parentLabel': null,
                'thisId': node.id,
                'thisLabel': node.label,
                'children': node.children.map(x=>x.id),
                'branchLength': 0.,
                'isTip': false,
                'x': node.x,
                'y': node.y,
                'angle': node.angle
            })
        }
        else {
            df.push({
                'parentId': node.parent.id,
                'parentLabel': node.parent.label,
                'thisId': node.id,
                'thisLabel': node.label,
                'children': node.children.map(x=>x.id),
                'branchLength': node.branchLength,
                'isTip': (node.children.length==0),
                'x': node.x,
                'y': node.y,
                'angle': node.angle
            })
        }
    }

    if (sort) {
        df = df.sort(function(a, b) {
            return a.thisId - b.thisId;
        })
    }
    return(df);
}

/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think. 
 * @param {object} tree Return value of fortify
 * @return Array of Objects
 */

// was exported

function edges(df, rectangular=false) {
    var result = [],
        parent, pair;

    // make sure data frame is sorted
    df.sort(function(a, b) {
        return a.thisId - b.thisId;
    })

    for (const row of df) {
        var x1 = row.x;
        var y1 = row.y;
        if (row.parentId === null) {
            continue  // skip the root
        }
        parent = df[row.parentId];
        if (parent === null || parent === undefined) continue;

        if (rectangular) {
          var pair = {
              x1: row.x, y1: row.y, id1: row.thisId,
              x2: parent.x, y2: row.y, id2: undefined
          };
          result.push(pair);
          var pair = {
              x1: parent.x, y1: row.y, id1: undefined,
              x2: parent.x, y2: parent.y, id2: row.parentId
          };
          result.push(pair);
        }
        else {
          var pair = {
              x1: row.x, y1: row.y, id1: row.thisId,
              x2: parent.x, y2: parent.y, id2: row.parentId
          };
          result.push(pair);
        }
    }
    return(result);
}