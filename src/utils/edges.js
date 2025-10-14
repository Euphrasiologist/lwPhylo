/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 */

export default function edges(df, rectangular = false) {
  const rows = [...df].sort((a, b) => a.thisId - b.thisId);
  const byId = new Map(rows.map((r) => [r.thisId, r]));
  const result = [];

  for (const row of rows) {
    if (row.parentId == null) continue;
    const parent = byId.get(row.parentId);
    if (!parent) continue;

    if (rectangular) {
      result.push({ x1: row.x, y1: row.y, id1: row.thisId, x2: parent.x, y2: row.y, id2: undefined });
      result.push({ x1: parent.x, y1: row.y, id1: undefined, x2: parent.x, y2: parent.y, id2: row.parentId });
    } else {
      result.push({ x1: row.x, y1: row.y, id1: row.thisId, x2: parent.x, y2: parent.y, id2: row.parentId });
    }
  }
  return result;
}

