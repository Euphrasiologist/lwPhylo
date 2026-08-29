import * as d3 from "d3";
import * as lw from "../index.js";

// Round a raw data-space length to a "nice" 1/2/5-of-a-power-of-ten value,
// so an auto-sized scale bar doesn't show an ugly number like "0.347".
function niceScaleLength(target) {
  if (!(target > 0)) return 1;
  const exp = Math.floor(Math.log10(target));
  const base = Math.pow(10, exp);
  const residual = target / base;
  const niceResidual = residual < 1.5 ? 1 : residual < 3.5 ? 2 : residual < 7.5 ? 5 : 10;
  return niceResidual * base;
}

// scaleBar: true | number (explicit data-units length) | { length, x, y, label }
function addScaleBar(svg, { scale, basis, defaultX, defaultY, scaleBar, fontSize }) {
  const opts = (scaleBar === true || typeof scaleBar === "number") ? {} : scaleBar;
  const length = typeof scaleBar === "number" ? scaleBar : (opts.length ?? niceScaleLength(basis / 5));
  const x = opts.x ?? defaultX;
  const y = opts.y ?? defaultY;
  const barPx = scale(length) - scale(0);

  const g = svg.append("g").attr("class", "phylo_scale_bar");
  g.append("line")
    .attr("x1", x).attr("x2", x + barPx)
    .attr("y1", y).attr("y2", y)
    .attr("stroke", "#000")
    .attr("stroke-width", 1);
  [x, x + barPx].forEach((tx) => {
    g.append("line")
      .attr("x1", tx).attr("x2", tx)
      .attr("y1", y - 4).attr("y2", y + 4)
      .attr("stroke", "#000")
      .attr("stroke-width", 1);
  });
  g.append("text")
    .attr("x", x + barPx / 2)
    .attr("y", y - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", fontSize)
    .text(opts.label ?? String(length));
}

// input: a Newick string, or an already-parsed tree (the node shape returned
// by readTree()/randomTree()). Passing the same parsed tree object back in
// across re-renders (e.g. after mutating it with rotate()) keeps node ids
// stable, which onNodeClick below relies on.
export default function drawPhylogeny(
  input,
  {
    layout = "rect", // rect/radial/unrooted
    width = 800,
    height = 800,
    margin = { top: 20, right: 300, bottom: 20, left: 50 },
    radialMargin = 80,
    strokeWidth = 1, // for the phylogeny branches
    radialMode = "outer", // "outer" (co-circular tips) or "phylo" (true terminals)
    tipLabels = true,
    labelFontSize = 10, // font size (px) for tip labels
    tipRadius, // px radius of tip dots; defaults to each layout's original size
    internalNodeCircles = false, // draw a circle at every internal (non-tip) node
    internalNodeRadius = 3, // px radius for internal node circles
    nodeLabels = false, // draw text labels at internal nodes (e.g. clade/support labels)
    nodeLabelFontSize, // defaults to labelFontSize
    scaleBar = false, // false | true | number (branch-length units) | { length, x, y, label }
    alignTipLabels = false, // rect & radial only: align tip labels to a common column/ring, with dashed guide lines back to the true tip position
    onNodeClick, // (node, event) => void — fires when an internal node circle is clicked (requires internalNodeCircles: true)
    showTooltips = true,
    tooltipFormatter = (d, rtt) =>
      `${d.thisLabel ?? "(unnamed)"}\nroot→tip: ${(+rtt).toFixed(4)}`,
    hoverStroke = "#1f77b4",
    hoverWidth = 3,
    highlightTips = [], // array of tip labels or ids for static highlight (optional)
    highlightStroke = "#e63946",
    highlightWidth = 2.5
  } = {}
) {

  // shared helpers
  const isNumber = (x) => typeof x === "number" && Number.isFinite(x);
  const nodeLabelSize = nodeLabelFontSize ?? labelFontSize;
  const parsedTree = (input && typeof input === "object" && Array.isArray(input.children))
    ? input
    : lw.readTree(input);
  // Works for both radial (uses `r`) and rect (uses `x1`).
  // Falls back to summing branchLength up to the root if neither is present.
  function makeRootToTipGetter(byId, { prefer = "auto" } = {}) {
    return function rootToTip(tipId) {
      let n = byId.get(tipId);
      if (!n) return 0;

      // Prefer explicit cumulative fields if present
      if (prefer === "r" || (prefer === "auto" && "r" in n)) {
        return Number(n.r ?? 0);
      }
      if (prefer === "x1" || (prefer === "auto" && "x1" in n)) {
        return Number(n.x1 ?? 0);
      }

      // Fallback: sum branchLength up the ancestry
      let sum = 0;
      while (n && n.parentId != null) {
        sum += Number(n.branchLength || 0); // null/undefined → 0
        n = byId.get(n.parentId);
      }
      return sum;
    };
  }


  if (layout === "rect") {
    // RECTANGULAR LAYOUT
    const tree_df = lw.rectangleLayout(parsedTree);
    const horizontal = tree_df.horizontal_lines;
    const vertical = tree_df.vertical_lines;
    const tips = horizontal.filter((d) => d.isTip);

    // indices & root→tip getter
    const byId = new Map(tree_df.data.map((d) => [d.thisId, d])); // includes root
    const tipById = new Map(tips.map((d) => [d.thisId, d]));
    const tipByLabel = new Map(tips.map((d) => [d.thisLabel, d]));
    const rootToTip = makeRootToTipGetter(byId, { prefer: "x1" });
    const R_TIP = tipRadius ?? 2;

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

    // layers for highlight/hover
    const staticLayer = svg.append("g").attr("class", "phylo_static_highlight");
    const hoverLayer = svg.append("g").attr("class", "phylo_hover_highlight");

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

    // tip dots
    const tipDots = group
      .selectAll(".tip-dot")
      .data(tips)
      .join("circle")
      .attr("cx", (d) => xScale(d.x1))
      .attr("cy", (d) => yScale(d.y1))
      .attr("r", R_TIP)
      .attr("fill", "black");

    // tooltips for rect dots
    if (showTooltips) {
      tipDots
        .append("title")
        .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
    }

    // interactive root→tip highlight (rect) on dot hover
    tipDots
      .on("mouseenter", function(_event, d) {
        hoverLayer.selectAll("*").remove();
        drawRectPath(d.thisId, hoverLayer, hoverStroke, hoverWidth);
        d3.select(this).attr("r", R_TIP + 2);
      })
      .on("mouseleave", function() {
        hoverLayer.selectAll("*").remove();
        d3.select(this).attr("r", R_TIP);
      });

    // internal node circles (optional)
    if (internalNodeCircles) {
      const internalNodes = tree_df.data.filter((d) => !d.isTip);
      const internalDots = group
        .append("g")
        .attr("class", "phylo_internal_dots")
        .selectAll("circle")
        .data(internalNodes)
        .join("circle")
        .attr("cx", (d) => xScale(d.x1))
        .attr("cy", (d) => yScale(d.y1))
        .attr("r", internalNodeRadius)
        .attr("fill", "white")
        .attr("stroke", "#555")
        .attr("stroke-width", 1);

      if (showTooltips) {
        internalDots
          .append("title")
          .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
      }

      if (onNodeClick) {
        internalDots
          .style("cursor", "pointer")
          .on("click", (event, d) => onNodeClick(d, event));
      }
    }

    // internal node labels (optional)
    if (nodeLabels) {
      const labeledInternalNodes = tree_df.data.filter((d) => !d.isTip && d.thisLabel);
      svg
        .append("g")
        .attr("class", "phylo_node_labels")
        .selectAll("text")
        .data(labeledInternalNodes)
        .join("text")
        .attr("x", (d) => xScale(d.x1) - 4)
        .attr("y", (d) => yScale(d.y1) - 4)
        .attr("text-anchor", "end")
        .attr("font-size", nodeLabelSize)
        .text((d) => d.thisLabel);
    }

    // column that tip labels align to when alignTipLabels is set
    const alignX = xScale(maxX);

    // dashed guide lines from each tip's true branch end to the aligned label column
    if (tipLabels && alignTipLabels) {
      group
        .append("g")
        .attr("class", "phylo_align_guides")
        .selectAll("line")
        .data(tips)
        .join("line")
        .attr("x1", (d) => xScale(d.x1))
        .attr("x2", alignX)
        .attr("y1", (d) => yScale(d.y1))
        .attr("y2", (d) => yScale(d.y1))
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2");
    }

    // labels
    if (tipLabels) {
      const labels = svg
        .append("g")
        .attr("class", "phylo_labels")
        .selectAll("text")
        .data(tips)
        .join("text")
        .attr("x", (d) => (alignTipLabels ? alignX : xScale(d.x1)) + 4)
        .attr("y", (d) => yScale(d.y1))
        .attr("dy", "0.32em")
        .attr("font-size", labelFontSize)
        .text((d) => d.thisLabel?.replace(/_/g, " ") ?? "");

      if (showTooltips) {
        labels
          .append("title")
          .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
      }

      labels
        .on("mouseenter", function(_event, d) {
          hoverLayer.selectAll("*").remove();
          drawRectPath(d.thisId, hoverLayer, hoverStroke, hoverWidth);
          d3.select(this).attr("font-weight", 600);
        })
        .on("mouseleave", function() {
          hoverLayer.selectAll("*").remove();
          d3.select(this).attr("font-weight", null);
        });
    }

    // static highlight by ids/labels
    if (highlightTips && highlightTips.length) {
      const chosen = new Set(
        [
          ...highlightTips.filter(isNumber).map((id) => tipById.get(id)),
          ...highlightTips
            .filter((x) => !isNumber(x))
            .map((lb) => tipByLabel.get(lb))
        ].filter(Boolean)
      );
      chosen.forEach((tip) => {
        drawRectPath(tip.thisId, staticLayer, highlightStroke, highlightWidth);
      });
    }

    // helper to draw root→tip for rect (both vertical+horizontal)
    function drawRectPath(tipId, layer, stroke, width) {
      let cur = byId.get(tipId);
      while (cur && cur.parentId != null) {
        const parent = byId.get(cur.parentId);
        if (!parent) break;

        // vertical at junction x0 from parent.y to child.y
        layer
          .append("line")
          .attr("x1", xScale(cur.x0))
          .attr("x2", xScale(cur.x0))
          .attr("y1", yScale(parent.y0))
          .attr("y2", yScale(cur.y0))
          .attr("stroke", stroke)
          .attr("stroke-width", width)
          .attr("stroke-linecap", "round");

        // horizontal along child's y, from junction x0 to x1
        layer
          .append("line")
          .attr("x1", xScale(cur.x0))
          .attr("x2", xScale(cur.x1))
          .attr("y1", yScale(cur.y0))
          .attr("y2", yScale(cur.y1))
          .attr("stroke", stroke)
          .attr("stroke-width", width)
          .attr("stroke-linecap", "round");

        cur = parent;
      }
    }

    if (scaleBar) {
      addScaleBar(svg, {
        scale: xScale,
        basis: maxX,
        defaultX: margin.left,
        defaultY: height - margin.bottom / 2,
        scaleBar,
        fontSize: labelFontSize
      });
    }

    return svg.node();
  } else if (layout === "radial") {
    // RADIAL LAYOUT
    if (width !== height) {
      throw new Error("width and height must be the same for radial layout");
    }
    const rad = lw.radialLayout(parsedTree, {
      angleStrategy: "fan",
      arcsStyle: "fan"
    });

    // ===== MODE =====
    const TIP_MODE = radialMode; // "phylo" (shorten to original tips) or "outer" (project to one circle)
    const isOuter = TIP_MODE === "outer";
    if (TIP_MODE !== "phylo" && TIP_MODE !== "outer") {
      throw new Error("radialMode must be either 'phylo' or 'outer'");
    }


    // visuals (0 = let spokes reach the dots)
    const DOT_R = tipRadius ?? 3;
    const END_CAP = 0;

    // ===== SCALES / BOUNDS =====
    const w = width,
      h = height;
    const maxRadius = d3.max(rad.data, (d) => d.r) ?? 0;
    // radialMargin is in pixels: tips sit (radialMargin) px from the SVG edge.
    // Derive the data-space scale so that radiusPx(maxRadius) = w/2 - radialMargin.
    const scaleRadial = maxRadius > 0
      ? maxRadius * (w / 2) / (w / 2 - radialMargin)
      : 1;
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
    const rootToTip = makeRootToTipGetter(byId, { prefer: "r" });
    const tipById = new Map(tips.map((d) => [d.thisId, d])); // HILITE:
    const tipByLabel = new Map(tips.map((d) => [d.thisLabel, d])); // HILITE:

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

    // overlay groups (drawn on top)
    const staticLines = svg.append("g").attr("class", "phylo_static_lines"); // HILITE:
    const staticArcs = svg.append("g").attr("class", "phylo_static_arcs"); // HILITE:
    const hoverLines = svg.append("g").attr("class", "phylo_hover_lines"); // HILITE:
    const hoverArcs = svg.append("g").attr("class", "phylo_hover_arcs"); // HILITE:

    // ===== ARCS (parent circles) =====
    group
      .append("g")
      .attr("class", "phylo_arcs")
      .selectAll("path")
      .data(rad.arcs)
      .join("path")
      .attr("d", (d) =>
        d.sweep == null
          ? lw.describeArc(
            centerX,
            centerY,
            radiusPx(d.radius),
            d.start,
            d.end
          )
          : lw.describeArcSweep(
            centerX,
            centerY,
            radiusPx(d.radius),
            d.start,
            d.end,
            d.sweep ?? "ccw",
            d.largeArc ?? 0,
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
      .each(function(s, _i) {
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

    // ===== ALIGN GUIDES (optional) =====
    // dashed lines from each tip's true position to the common label ring,
    // for radialMode "phylo" (true terminals) where tips aren't already co-circular
    if (tipLabels && alignTipLabels && !isOuter) {
      group
        .append("g")
        .attr("class", "phylo_align_guides")
        .selectAll("line")
        .data(tips)
        .join("line")
        .attr("x1", (d) => xScaleRadial(d.x))
        .attr("y1", (d) => yScaleRadial(d.y))
        .attr("x2", (d) => xScaleRadial(tipMaxR * Math.cos(d.angle)))
        .attr("y2", (d) => yScaleRadial(tipMaxR * Math.sin(d.angle)))
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2");
    }

    // ===== TIP DOTS =====
    const tipDots = group
      .append("g")
      .attr("class", "phylo_tip_dots")
      .selectAll("circle")
      .data(tips)
      .join("circle")
      .each(function(d, _i) {
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

    if (showTooltips) {
      tipDots
        .append("title")
        .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
    }

    // ===== INTERNAL NODE CIRCLES (optional) =====
    if (internalNodeCircles) {
      const internalNodes = rad.data.filter((d) => !d.isTip);
      const internalDots = group
        .append("g")
        .attr("class", "phylo_internal_dots")
        .selectAll("circle")
        .data(internalNodes)
        .join("circle")
        .attr("cx", (d) => xScaleRadial(d.x))
        .attr("cy", (d) => yScaleRadial(d.y))
        .attr("r", internalNodeRadius)
        .attr("fill", "white")
        .attr("stroke", "#555")
        .attr("stroke-width", 1);

      if (showTooltips) {
        internalDots
          .append("title")
          .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
      }

      if (onNodeClick) {
        internalDots
          .style("cursor", "pointer")
          .on("click", (event, d) => onNodeClick(d, event));
      }
    }

    // ===== INTERNAL NODE LABELS (optional) =====
    if (nodeLabels) {
      const labeledInternalNodes = rad.data.filter((d) => !d.isTip && d.thisLabel);
      group
        .append("g")
        .attr("class", "phylo_node_labels")
        .selectAll("text")
        .data(labeledInternalNodes)
        .join("text")
        .attr("x", (d) => xScaleRadial(d.x) + 4)
        .attr("y", (d) => yScaleRadial(d.y) - 4)
        .attr("font-size", nodeLabelSize)
        .attr("fill", "black")
        .text((d) => d.thisLabel);
    }

    // maps for fast lookup on hover (childId → spoke / arc)
    const key = (x) => (typeof x === "string" ? +x : x);
    const spokeByChild = new Map(rad.radii.map(s => [key(s.childId ?? s.thisId ?? s.id1), s]));
    const arcByChild = new Map(rad.child_arcs.map(a => [key(a.childId), a]));


    // ===== LABELS =====
    // Labels — make them follow the tip position used by the current mode
    if (tipLabels) {
      const labels = group
        .append("g")
        .attr("class", "phylo_labels")
        .selectAll("g.label")
        .data(tips)
        .join("g")
        .attr("class", "label")
        .attr("transform", (d) => {
          // same tip position rule as dots/spokes:
          //  - "outer": snap to common ring (tipMaxR)
          //  - otherwise (e.g. "align"/"phylo"): true tip radius
          //  - alignTipLabels forces the common ring regardless of mode
          const r = (isOuter || alignTipLabels) ? tipMaxR : d.r;
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
            .attr("font-size", labelFontSize)
            .attr("fill", "black")
            .text((d) => d.thisLabel?.replace(/_/g, " ") ?? "");
        });

      if (showTooltips) {
        labels
          .append("title")
          .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
      }

      // label hover
      labels
        .on("mouseenter", function(_event, d) {
          hoverLines.selectAll("*").remove();
          hoverArcs.selectAll("*").remove();
          drawRadialPath(d, hoverLines, hoverArcs, hoverStroke, hoverWidth);
          d3.select(this).select("text").attr("font-weight", 600);
        })
        .on("mouseleave", function() {
          hoverLines.selectAll("*").remove();
          hoverArcs.selectAll("*").remove();
          d3.select(this).select("text").attr("font-weight", null);
        });
    }

    // draw (overlay) the root→tip path: spokes + arcs (half-arc per child)
    function drawRadialPath(
      target,
      lineLayer,
      arcLayer,
      stroke = "#1f77b4",
      width = 3
    ) {
      // target may be a tip node *or* a numeric tip id
      let cur = (typeof target === "number" || typeof target === "string")
        ? byId.get(target)
        : target;

      if (!cur) return;

      let first = true;
      while (cur && cur.parentId != null) {
        // ----- spoke (parent → child) -----
        const s = spokeByChild.get(key(cur.thisId));
        if (s) {
          const px = s.x0,
            py = s.y0;
          let cx = s.x1,
            cy = s.y1;
          if (isOuter && first && cur.isTip) {
            const r = tipMaxR;
            cx = r * Math.cos(cur.angle);
            cy = r * Math.sin(cur.angle);
          }
          const { X0, Y0, X1s, Y1s } = shortenSpokePx(px, py, cx, cy);
          lineLayer
            .append("line")
            .attr("x1", X0)
            .attr("y1", Y0)
            .attr("x2", X1s)
            .attr("y2", Y1s)
            .attr("stroke", stroke)
            .attr("stroke-width", width)
            .attr("stroke-linecap", "round");
        }

        // ----- half-arc at parent radius (parent.angle → child.angle) -----
        const a = arcByChild.get(key(cur.thisId));
        function pathFromArcRecord(rec) {
          const R = radiusPx(rec.radius);
          return rec.sweep == null
            ? lw.describeArc(centerX, centerY, R, rec.start, rec.end)
            : lw.describeArcSweep(centerX, centerY, R, rec.start, rec.end, rec.sweep ?? "ccw", rec.largeArc ?? 0);
        }

        if (a) {
          arcLayer
            .append("path")
            .attr("d", pathFromArcRecord(a))
            .attr("fill", "none")
            .attr("stroke", stroke)
            .attr("stroke-width", width);
        }

        first = false;
        cur = byId.get(cur.parentId);
      }
    }

    // tip dot hover
    tipDots
      .on("mouseenter", function(_event, d) {
        hoverLines.selectAll("*").remove();
        hoverArcs.selectAll("*").remove();
        drawRadialPath(d, hoverLines, hoverArcs, hoverStroke, hoverWidth);
        d3.select(this).attr("r", DOT_R + 2);
      })
      .on("mouseleave", function() {
        hoverLines.selectAll("*").remove();
        hoverArcs.selectAll("*").remove();
        d3.select(this).attr("r", DOT_R);
      });

    if (highlightTips && highlightTips.length) {
      const chosen = new Set(
        [
          ...highlightTips.filter(isNumber).map((id) => tipById.get(id)),
          ...highlightTips
            .filter((x) => !isNumber(x))
            .map((lb) => tipByLabel.get(lb))
        ].filter(Boolean)
      );

      chosen.forEach((tip) => {
        drawRadialPath(
          tip.thisId,
          staticLines,
          staticArcs,
          highlightStroke,
          highlightWidth
        );
      });
    }

    if (scaleBar) {
      addScaleBar(svg, {
        scale: xScaleRadial,
        basis: maxRadius,
        defaultX: 20,
        defaultY: h - 20,
        scaleBar,
        fontSize: labelFontSize
      });
    }

    return svg.node();
  } else if (layout === "unrooted") {
    // UNROOTED LAYOUT
    const unrootedPhylo = lw.unrooted(parsedTree);

    const w = width;
    const h = height;

    const xExtent = d3.extent(unrootedPhylo.data, (d) => d.x);
    const yExtent = d3.extent(unrootedPhylo.data, (d) => d.y);
    const maxX = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
    const maxY = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
    const maxRadius = Math.max(maxX, maxY);
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
    const staticLayer = svg.append("g").attr("class", "phylo_static_highlight");
    const hoverLayer = svg.append("g").attr("class", "phylo_hover_highlight");

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

    const R_TIP = tipRadius ?? 4;

    const nodes = group
      .append("g")
      .attr("class", "phylo_points")
      .selectAll("circle")
      .data(unrootedPhylo.data)
      .join("circle")
      .attr("class", "dot")
      .attr("r", (d) => (d.isTip ? R_TIP : (internalNodeCircles ? internalNodeRadius : 0)))
      .attr("cx", (d) => xScaleUnroot(d.x))
      .attr("cy", (d) => yScaleUnroot(d.y))
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("fill", (d) => (d.isTip ? "black" : "white"));

    if (internalNodeCircles && onNodeClick) {
      nodes
        .filter((d) => !d.isTip)
        .style("cursor", "pointer")
        .on("click", (event, d) => onNodeClick(d, event));
    }

    if (nodeLabels) {
      const labeledInternalNodes = unrootedPhylo.data.filter((d) => !d.isTip && d.thisLabel);
      group
        .append("g")
        .attr("class", "phylo_node_labels")
        .selectAll("text")
        .data(labeledInternalNodes)
        .join("text")
        .attr("x", (d) => xScaleUnroot(d.x) + 4)
        .attr("y", (d) => yScaleUnroot(d.y) - 4)
        .attr("font-size", nodeLabelSize)
        .attr("fill", "black")
        .text((d) => d.thisLabel);
    }

    const byId = new Map(unrootedPhylo.data.map((d) => [d.thisId, d]));
    const tipById = new Map(
      unrootedPhylo.data.filter((d) => d.isTip).map((d) => [d.thisId, d])
    );
    const tipByLabel = new Map(
      unrootedPhylo.data.filter((d) => d.isTip).map((d) => [d.thisLabel, d])
    );
    const rootToTip = makeRootToTipGetter(byId);

    if (showTooltips) {
      nodes
        .filter((d) => d.isTip)
        .append("title")
        .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
    }

    const tipEdges = new Map();
    const nodesById = new Map(unrootedPhylo.data.map((d) => [d.thisId, d]));
    unrootedPhylo.edges.forEach((edge) => {
      const tipNode = nodesById.get(edge.id1);
      if (tipNode?.isTip) tipEdges.set(edge.id1, edge);
    });

    if (tipLabels) {
      const tipLabelsSel = group
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
          if (!edge) return;

          const x1 = xScaleUnroot(edge.x1);
          const y1 = yScaleUnroot(edge.y1);
          const x2 = xScaleUnroot(edge.x2);
          const y2 = yScaleUnroot(edge.y2);

          const dx = x2 - x1;
          const dy = y2 - y1;
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

          let xOffset = -10;
          let anchor = "end";
          if (angle > 90 || angle < -90) {
            angle += 180;
            anchor = "start";
            xOffset = 10;
          }

          d3.select(this)
            .append("g")
            .attr("transform", `rotate(${angle})`)
            .append("text")
            .attr("x", xOffset)
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", anchor)
            .attr("font-size", labelFontSize)
            .attr("fill", "black")
            .text(d.thisLabel?.replace(/_/g, " ") ?? "");
        });

      if (showTooltips) {
        tipLabelsSel
          .append("title")
          .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
      }

      tipLabelsSel
        .on("mouseenter", function(_event, d) {
          drawUnrootedPath(d.thisId, hoverLayer, hoverStroke, hoverWidth);
          d3.select(this).select("text").attr("font-weight", 600);
        })
        .on("mouseleave", function() {
          hoverLayer.selectAll("*").remove();
          d3.select(this).select("text").attr("font-weight", null);
        });
    }

    nodes
      .filter((d) => d.isTip)
      .on("mouseenter", function(_event, d) {
        drawUnrootedPath(d.thisId, hoverLayer, hoverStroke, hoverWidth);
        d3.select(this).attr("r", R_TIP + 2);
      })
      .on("mouseleave", function() {
        hoverLayer.selectAll("*").remove();
        d3.select(this).attr("r", R_TIP);
      });

    if (highlightTips && highlightTips.length) {
      const chosen = new Set(
        [
          ...highlightTips.filter(isNumber).map((id) => tipById.get(id)),
          ...highlightTips
            .filter((x) => !isNumber(x))
            .map((lb) => tipByLabel.get(lb))
        ].filter(Boolean)
      );
      chosen.forEach((tip) => {
        drawUnrootedPath(
          tip.thisId,
          staticLayer,
          highlightStroke,
          highlightWidth
        );
      });
    }

    function drawUnrootedPath(tipId, layer, stroke, width) {
      const edgeFromChild = new Map(unrootedPhylo.edges.map((e) => [e.id1, e]));
      layer.selectAll("*").remove();
      let cur = byId.get(tipId);
      while (cur && cur.parentId != null) {
        const e = edgeFromChild.get(cur.thisId);
        if (e) {
          layer
            .append("line")
            .attr("x1", xScaleUnroot(e.x1))
            .attr("y1", yScaleUnroot(e.y1))
            .attr("x2", xScaleUnroot(e.x2))
            .attr("y2", yScaleUnroot(e.y2))
            .attr("stroke", stroke)
            .attr("stroke-width", width)
            .attr("stroke-linecap", "round");
        }
        cur = byId.get(cur.parentId);
      }
    }

    if (scaleBar) {
      addScaleBar(svg, {
        scale: xScaleUnroot,
        basis: maxRadius,
        defaultX: 20,
        defaultY: h - 20,
        scaleBar,
        fontSize: labelFontSize
      });
    }

    return svg.node();
  } else {
    throw new Error(
      "Unsupported layout type. Use 'rect', 'radial', or 'unrooted'."
    );
  }
}
