export function makeIndexById(rows, key = "thisId") {
  return new Map(rows.map(d => [d[key], d]));
}
export default function parentFisheye(d, data) {
  const byId = makeIndexById(data);
  const parent = byId.get(d.parentId);
  return parent ? { px: parent.fisheye.x, py: parent.fisheye.y } : null;
}

