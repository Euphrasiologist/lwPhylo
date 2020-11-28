import { preorder } from "./preorder.js"

/**
 * Convert parsed Newick tree from readTree() into data
 * frame.
 * this is akin to a "phylo" object in R.
 */

export default function(tree, sort = true) {
    var df = [];

    for (const node of preorder(tree)) {
        if (node.parent === null) {
            df.push({
                'parentId': null,
                'parentLabel': null,
                'thisId': node.id,
                'thisLabel': node.label,
                'children': node.children.map(x => x.id),
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
                'children': node.children.map(x => x.id),
                'branchLength': node.branchLength,
                'isTip': (node.children.length == 0),
                'x': node.x,
                'y': node.y,
                'angle': node.angle
            })
        }
    }

    if (sort) {
        df = df.sort(function (a, b) {
            return a.thisId - b.thisId;
        })
    }
    return (df);
}
