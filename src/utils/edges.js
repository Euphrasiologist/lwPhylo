/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 */

export default function (df, rectangular = false) {
  var result = [],
    parent

  // make sure data frame is sorted
  df.sort(function (a, b) {
    return a.thisId - b.thisId;
  });

  for (const row of df) {
    if (row.parentId === null) {
      continue; // skip the root
    }
    parent = df[row.parentId];
    if (parent === null || parent === undefined) continue;

    if (rectangular) {
      var pair1 = {
        x1: row.x,
        y1: row.y,
        id1: row.thisId,
        x2: parent.x,
        y2: row.y,
        id2: undefined
      };
      result.push(pair1);
      var pair2 = {
        x1: parent.x,
        y1: row.y,
        id1: undefined,
        x2: parent.x,
        y2: parent.y,
        id2: row.parentId
      };
      result.push(pair2);
    } else {
      var pair3 = {
        x1: row.x,
        y1: row.y,
        id1: row.thisId,
        x2: parent.x,
        y2: parent.y,
        id2: row.parentId
      };
      result.push(pair3);
    }
  }
  return result;
}