import * as d3 from "d3";
import * as lw from "../index.js";

export default function drawPhylogeny(
  treeText,
  {
    layout = "rect", // rect/radial/unrooted
    width = 800,
    height = 800,
    margin = { top: 20, right: 300, bottom: 20, left: 50 },
    radialMargin = 80,
    strokeWidth = 1, // for the phylogeny branches
    radialMode = "outer", // "outer" (co-circular tips) or "phylo" (true terminals)
    tipLabels = true,
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
  function makeRootToTipGetter(byId) {
    const memo = new Map();
    return function rootToTip(id) {
      if (memo.has(id)) return memo.get(id);
      let cur = byId.get(id);
      let sum = 0;
      while (cur && cur.parentId != null) {
        sum += +cur.branchLength || 0;
        cur = byId.get(cur.parentId);
      }
      memo.set(id, sum);
      return sum;
    };
  }

  if (layout === "rect") {
    // RECTANGULAR LAYOUT
    const tree_df = lw.rectangleLayout(lw.readTree(treeText));
    const horizontal = tree_df.horizontal_lines;
    const vertical = tree_df.vertical_lines;
    const tips = horizontal.filter((d) => d.isTip);

    // indices & root→tip getter
    const byId = new Map(horizontal.map((d) => [d.thisId, d]));
    const tipById = new Map(tips.map((d) => [d.thisId, d]));
    const tipByLabel = new Map(tips.map((d) => [d.thisLabel, d]));
    const rootToTip = makeRootToTipGetter(byId);

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
      .attr("r", 2)
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
        drawRectPath(d.thisId, hoverLayer, hoverStroke, hoverWidth);
        d3.select(this).attr("r", 4);
      })
      .on("mouseleave", function() {
        hoverLayer.selectAll("*").remove();
        d3.select(this).attr("r", 2);
      });

    // labels
    if (tipLabels) {
      const labels = svg
        .append("g")
        .attr("class", "phylo_labels")
        .selectAll("text")
        .data(tips)
        .join("text")
        .attr("x", (d) => xScale(d.x1) + 4)
        .attr("y", (d) => yScale(d.y1))
        .attr("dy", "0.32em")
        .attr("font-size", 10)
        .text((d) => d.thisLabel?.replace(/_/g, " ") ?? "");

      if (showTooltips) {
        labels
          .append("title")
          .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
      }

      labels
        .on("mouseenter", function(_event, d) {
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
      layer.selectAll("*").remove();
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

    return svg.node();
  } else if (layout === "radial") {
    // RADIAL LAYOUT
    if (width !== height) {
      new Error("width and height must be the same for radial layout");
    }
    const parsedTree = lw.readTree(treeText);
    const rad = lw.radialLayout(parsedTree);

    // ===== MODE =====
    const TIP_MODE = radialMode; // "phylo" (shorten to original tips) or "outer" (project to one circle)
    const isOuter = TIP_MODE === "outer";
    if (TIP_MODE != "phylo" || TIP_MODE != "outer") {
      new Error("radialMode must be either 'phylo' or 'outer'");
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
    const rootToTip = makeRootToTipGetter(byId);
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

    // maps for fast lookup on hover (childId → spoke / arc)
    const spokeByChild = new Map(rad.radii.map((s) => [childIdOf(s), s]));
    const arcByChild = new Map(rad.child_arcs.map((a) => [a.childId, a]));

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

      if (showTooltips) {
        labels
          .append("title")
          .text((d) => tooltipFormatter(d, rootToTip(d.thisId)));
      }

      // label hover
      labels
        .on("mouseenter", function(event, d) {
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
      lineLayer.selectAll("*").remove();
      arcLayer.selectAll("*").remove();

      let cur = typeof target === "number" ? byId.get(target) : target;
      if (!cur) return;

      let first = true;
      while (cur && cur.parentId != null) {
        // ----- spoke (parent → child) -----
        const s = spokeByChild.get(cur.thisId);
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
        const a = arcByChild.get(cur.thisId);
        if (a) {
          arcLayer
            .append("path")
            .attr(
              "d",
              lw.describeArc(
                centerX,
                centerY,
                Math.max(0, radiusPx(a.radius)),
                a.start,
                a.end
              )
            )
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

    return svg.node();
  } else if (layout === "unrooted") {
    // UNROOTED LAYOUT
    const parsedTree = lw.readTree(treeText);
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

    const nodes = group
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
            .attr("font-size", 10)
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
        d3.select(this).attr("r", 6);
      })
      .on("mouseleave", function() {
        hoverLayer.selectAll("*").remove();
        d3.select(this).attr("r", 4);
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

    return svg.node();
  } else {
    throw new Error(
      "Unsupported layout type. Use 'rect', 'radial', or 'unrooted'."
    );
  }
}
