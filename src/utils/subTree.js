/** 
* Subset a tree given a node - i.e. the node of interests and all the descendents
*/

export default function(tree, node) {
    // Thanks Richard Challis!
    let fullTree = {};
    tree.data.forEach(obj => {
        fullTree[obj.thisId] = {...obj};
    });

    let subTree = {};
    const getDescendants = function (rootNodeId) {
        if (fullTree[rootNodeId]) {
            subTree[rootNodeId] = fullTree[rootNodeId];
            if (fullTree[rootNodeId].children) {
                fullTree[rootNodeId].children.forEach(childNodeId => {
                    getDescendants(childNodeId);
                });
            }
        }
    };
    // call the recursive function
    getDescendants(node);

    // in each of the functions, data contains the children key
    const data = [["data", Object.values(subTree)]];

    const nodes = data[0][1].map(d => d.thisId);

    var res = [];
    // in all keys except data, push to new array
    for (const node in tree) {
        if (node === "data") continue;
        res.push([node, tree[node]]);
    }

    var filtered = res.map(d => [
        d[0],
        d[1].filter(d => nodes.includes(d.thisId))
    ]);

    return Object.fromEntries(data.concat(filtered));
}
