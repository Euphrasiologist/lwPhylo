import * as d3 from "d3";
import * as lw from "../index.js";

export default function drawPhylogeny(
  treeText,
  {
    layout = "rect", // "rect" or "radial"
    width = 800,
    height = 800,
    margin = { top: 20, right: 300, bottom: 20, left: 50 },
    radialMargin = 80,
    strokeWidth = 1,
    radialMode = "outer" // or "align"
  } = {}
) {
  if (layout === "rect") {
    // RECTANGULAR LAYOUT
    const tree_df = lw.rectangleLayout(lw.readTree(treeText));
    const horizontal = tree_df.horizontal_lines;
    const vertical = tree_df.vertical_lines;
    const tips = horizontal.filter((d) => d.isTip);

    const maxY = d3.max(horizontal, (d) => d.y1);
    const minY = d3.min(horizontal, (d) => d.y1);
    const maxX = d3.max(horizontal, (d) => d.x1);

    const yScale = d3
      .scaleLinear()
      .domain([minY - 1, maxY + 1])
      .range([margin.top, height - margin.bottom]);

    const xScale = d3
      .scaleLinear()
      .domain([0, maxX])
      .range([margin.left, width - margin.right]);

    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    const group = svg.append("g");

    group
      .selectAll(".hline")
      .data(horizontal)
      .join("line")
      .attr("x1", (d) => xScale(d.x0))
      .attr("y1", (d) => yScale(d.y0))
      .attr("x2", (d) => xScale(d.x1))
      .attr("y2", (d) => yScale(d.y1))
      .attr("stroke", "#555")
      .attr("stroke-width", strokeWidth);

    group
      .selectAll(".vline")
      .data(vertical)
      .join("line")
      .attr("x1", (d) => xScale(d.x0))
      .attr("y1", (d) => yScale(d.y0))
      .attr("x2", (d) => xScale(d.x1))
      .attr("y2", (d) => yScale(d.y1))
      .attr("stroke", "#555")
      .attr("stroke-width", strokeWidth);

    group
      .selectAll(".tip-dot")
      .data(tips)
      .join("circle")
      .attr("cx", (d) => xScale(d.x1))
      .attr("cy", (d) => yScale(d.y1))
      .attr("r", 2)
      .attr("fill", "black");

    svg
      .append("g")
      .selectAll("text")
      .data(tips)
      .join("text")
      .attr("x", (d) => xScale(d.x1) + 4)
      .attr("y", (d) => yScale(d.y1))
      .attr("dy", "0.32em")
      .attr("font-size", 10)
      .text((d) => d.thisLabel?.replace(/_/g, " ") ?? "");

    return svg.node();
  } else if (layout === "radial") {
    // RADIAL LAYOUT
    if (width !== height) {
      new Error("width and height must be the same for radial layout");
    }
    const parsedTree = lw.readTree(treeText);
    const rad = lw.radialLayout(parsedTree);

    // ===== MODE =====
    const TIP_MODE = radialMode; // "align" (shorten to original tips) or "outer" (project to one circle)
    const isOuter = TIP_MODE === "outer";
    if (TIP_MODE != "phylo" || TIP_MODE != "outer") {
      new Error("radialMode can be only either 'outer' to align tips around the circumference, or 'phylo' which shows terminal branch lengths");
    }

    // visuals (0 = let spokes reach the dots)
    const DOT_R = 3;
    const END_CAP = 0;

    // ===== SCALES / BOUNDS =====
    const maxRadius = d3.max(rad.data, (d) => d.r) ?? 0;
    const scaleRadial = maxRadius + 2 * radialMargin;
    const w = width,
      h = height;
    const centerX = w / 2,
      centerY = h / 2;

    const xScaleRadial = d3
      .scaleLinear()
      .domain([-scaleRadial, scaleRadial])
      .range([0, w]);
    const yScaleRadial = d3
      .scaleLinear()
      .domain([-scaleRadial, scaleRadial])
      .range([h, 0]);
    const radiusPx = (r) => r * (w / (2 * scaleRadial));

    // ===== INDEXES / HELPERS =====
    const byId = new Map(rad.data.map((d) => [d.thisId, d]));
    const tips = rad.data.filter((d) => d.isTip);
    const tipMaxR = tips.length ? d3.max(tips, (d) => d.r) : 0;

    // Robust child-id extractor (handles multiple shapes)
    function childIdOf(spoke) {
      // prefer explicit child id fields; fall back to thisId; last-ditch id1 (seen in some edge shapes)
      return spoke.childId ?? spoke.thisId ?? spoke.id1 ?? null;
    }

    // Shorten the *screen-space* end of a spoke by END_CAP px
    function shortenSpokePx(x0, y0, x1, y1) {
      const X0 = xScaleRadial(x0),
        Y0 = yScaleRadial(y0);
      const X1 = xScaleRadial(x1),
        Y1 = yScaleRadial(y1);
      const dx = X1 - X0,
        dy = Y1 - Y0;
      const len = Math.hypot(dx, dy) || 1;
      const t = Math.max(0, (len - END_CAP) / len);
      return { X0, Y0, X1s: X0 + dx * t, Y1s: Y0 + dy * t, len };
    }

    // ===== SVG ROOT =====
    const svg = d3
      .create("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    const group = svg.append("g");

    // ===== ARCS (parent circles) =====
    group
      .append("g")
      .attr("class", "phylo_arcs")
      .selectAll("path")
      .data(rad.arcs)
      .join("path")
      .attr("d", (d) =>
        lw.describeArc(
          centerX,
          centerY,
          Math.max(0, radiusPx(d.radius)),
          d.start,
          d.end
        )
      )
      .attr("fill", "none")
      .attr("stroke", "#777")
      .attr("stroke-width", strokeWidth);

    // ===== RADII (spokes) =====
    group
      .append("g")
      .attr("class", "phylo_radii")
      .selectAll("line")
      .data(rad.radii)
      .join("line")
      .each(function(s, _) {
        // parent end (data space)
        const x0 = s.x0,
          y0 = s.y0;

        // child end (data space), shape-agnostic
        const cid = childIdOf(s);
        const node = cid != null ? byId.get(cid) : undefined;
        const isTipSpoke = !!(node && node.isTip);

        // default to the original child endpoint from the spoke record
        let x1 = s.x1,
          y1 = s.y1;

        // In "outer" mode, project only *tip* spokes to the common circle
        if (isOuter && isTipSpoke) {
          x1 = tipMaxR * Math.cos(node.angle);
          y1 = tipMaxR * Math.sin(node.angle);
        }

        // Shorten in screen space so the spoke doesn’t pierce the dot (END_CAP can be 0)
        const { X0, Y0, X1s, Y1s, _len } = shortenSpokePx(x0, y0, x1, y1);

        d3.select(this)
          .attr("x1", X0)
          .attr("y1", Y0)
          .attr("x2", X1s)
          .attr("y2", Y1s)
          .attr("stroke", "#777")
          .attr("stroke-width", strokeWidth);
      });

    // ===== TIP DOTS =====
    group
      .append("g")
      .attr("class", "phylo_tip_dots")
      .selectAll("circle")
      .data(tips)
      .join("circle")
      .each(function(d, _) {
        // dot at original tip (align) or projected circle (outer)
        const x = isOuter ? tipMaxR * Math.cos(d.angle) : d.x;
        const y = isOuter ? tipMaxR * Math.sin(d.angle) : d.y;

        d3.select(this)
          .attr("cx", xScaleRadial(x))
          .attr("cy", yScaleRadial(y))
          .attr("r", DOT_R)
          .attr("fill", "black")
          .attr("stroke", "black")
          .attr("stroke-width", 1.5);
      });

    // ===== LABELS (unchanged) =====
    // Labels — make them follow the tip position used by the current mode
    group
      .append("g")
      .attr("class", "phylo_labels")
      .selectAll("g.label")
      .data(tips) // <— bind only tip nodes
      .join("g")
      .attr("class", "label")
      .attr("transform", (d) => {
        // same tip position rule as dots/spokes:
        //  - "outer": snap to common ring (tipMaxR)
        //  - otherwise (e.g. "align"/"phylo"): true tip radius
        const r = isOuter ? tipMaxR : d.r;
        const x = r * Math.cos(d.angle);
        const y = r * Math.sin(d.angle);
        return `translate(${xScaleRadial(x)},${yScaleRadial(y)})`;
      })
      .each(function(d) {
        // rotate so text reads outward; flip when on the left side
        let angle = (-d.angle * 180) / Math.PI;
        let xoff = 10; // radial padding for text (px)
        let anchor = "start";
        if (d.angle > Math.PI / 2 && d.angle < (3 * Math.PI) / 2) {
          angle += 180;
          xoff *= -1;
          anchor = "end";
        }
        d3.select(this)
          .append("g")
          .attr("transform", `rotate(${angle})`)
          .append("text")
          .attr("x", xoff)
          .attr("alignment-baseline", "middle")
          .attr("text-anchor", anchor)
          .attr("font-size", 10)
          .attr("fill", "black")
          .text((d) => d.thisLabel?.replace(/_/g, " ") ?? "");
      });

    return svg.node();
  } else if (layout === "unrooted") {
    // UNROOTED LAYOUT
    const parsedTree = lw.readTree(treeText);
    const unrootedPhylo = lw.unrooted(parsedTree);

    const w = width;
    const h = height;

    // Get spatial extent
    const xExtent = d3.extent(unrootedPhylo.data, (d) => d.x);
    const yExtent = d3.extent(unrootedPhylo.data, (d) => d.y);

    // Find maximum absolute distance from center (0,0)
    const maxX = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
    const maxY = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
    const maxRadius = Math.max(maxX, maxY);

    // Add some margin
    const scaleUnroot = maxRadius + 2 * radialMargin;

    const xScaleUnroot = d3
      .scaleLinear()
      .domain([-scaleUnroot, scaleUnroot])
      .range([0, w]);

    const yScaleUnroot = d3
      .scaleLinear()
      .domain([-scaleUnroot, scaleUnroot])
      .range([h, 0]);

    const svg = d3
      .create("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    const group = svg.append("g");

    // Edges
    group
      .append("g")
      .attr("class", "phylo_lines")
      .selectAll("line")
      .data(unrootedPhylo.edges)
      .join("line")
      .attr("x1", (d) => xScaleUnroot(d.x1))
      .attr("y1", (d) => yScaleUnroot(d.y1))
      .attr("x2", (d) => xScaleUnroot(d.x2))
      .attr("y2", (d) => yScaleUnroot(d.y2))
      .attr("stroke-width", strokeWidth)
      .attr("stroke", "#777");

    // Nodes
    group
      .append("g")
      .attr("class", "phylo_points")
      .selectAll("circle")
      .data(unrootedPhylo.data)
      .join("circle")
      .attr("class", "dot")
      .attr("r", (d) => (d.isTip ? 4 : 0))
      .attr("cx", (d) => xScaleUnroot(d.x))
      .attr("cy", (d) => yScaleUnroot(d.y))
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("fill", (d) => (d.isTip ? "black" : "white"));

    // Tip labels
    const tipEdges = new Map();
    const nodesById = new Map(unrootedPhylo.data.map((d) => [d.thisId, d]));

    unrootedPhylo.edges.forEach((edge) => {
      const tipNode = nodesById.get(edge.id1);
      if (tipNode?.isTip) {
        tipEdges.set(edge.id1, edge);
      }
    });

    group
      .append("g")
      .attr("class", "phylo_labels")
      .selectAll("g")
      .data(unrootedPhylo.data.filter((d) => d.isTip))
      .join("g")
      .attr("transform", (d) => {
        const x = xScaleUnroot(d.x);
        const y = yScaleUnroot(d.y);
        return `translate(${x},${y})`;
      })
      .each(function(d) {
        const edge = tipEdges.get(d.thisId);
        if (!edge) {
          console.warn(
            "No incoming edge found for tip node:",
            d.thisId,
            d.thisLabel
          );
          return;
        }

        // Compute angle of the incoming edge (screen coords)
        const x1 = xScaleUnroot(edge.x1);
        const y1 = yScaleUnroot(edge.y1);
        const x2 = xScaleUnroot(edge.x2);
        const y2 = yScaleUnroot(edge.y2);

        const dx = x2 - x1;
        const dy = y2 - y1;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Flip label if upside down
        let xOffset = -10;
        let anchor = "end";
        if (angle > 90 || angle < -90) {
          angle += 180;
          anchor = "start";
          xOffset = 10;
        }

        // Draw label rotated along branch direction
        d3.select(this)
          .append("g")
          .attr("transform", `rotate(${angle})`)
          .append("text")
          .attr("x", xOffset)
          .attr("alignment-baseline", "middle")
          .attr("text-anchor", anchor)
          .attr("font-size", 10)
          .attr("fill", "black")
          .text(d.thisLabel?.replace(/_/g, " ") ?? "");
      });

    return svg.node();
  } else {
    throw new Error("Unsupported layout type. Use 'rect' or 'radial'.");
  }
}
