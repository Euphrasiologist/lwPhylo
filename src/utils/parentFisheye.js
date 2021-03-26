// find the x & y coordinates of the parental species
export default function (d, data /* e.g. lwPhylo.unrooted.data */) {
  for (let i = 0; i < data.length; i++) {
    if (d.parentId === data[i].thisId) {
      return {
        px: data[i].fisheye.x,
        py: data[i].fisheye.y
      };
    }
  }
}