/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think. 
 */

export default function(df, rectangular = false) {
    var result = [],
        parent, pair;

    // make sure data frame is sorted
    df.sort(function (a, b) {
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
                x1: row.x, y1: row.y, thisId: row.thisId,
                x2: parent.x, y2: row.y, parentId: undefined
            };
            result.push(pair);
            var pair = {
                x1: parent.x, y1: row.y, thisId: undefined,
                x2: parent.x, y2: parent.y, parentId: row.parentId
            };
            result.push(pair);
        }
        else {
            var pair = {
                x1: row.x, y1: row.y, thisId: row.thisId,
                x2: parent.x, y2: parent.y, parentId: row.parentId
            };
            result.push(pair);
        }
    }
    return (result);
}