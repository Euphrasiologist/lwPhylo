(function () {
    var treestring = "((((T366:0.04397509396,(T291:0.03300629849,(T308:0.02878967207,T304:0.02878967207)63.8:0.004216626411)55.4:0.01096879547)NA:0.002734443264,((T358:0.04072983677,T359:0.04072983677)NA:0.005801466325,((T310:0.03514753143,(T342:0.02779112233,(T297:0.02442060304,(T292:0.01538575591,(T299:0.01328827113,T298:0.01328827113)51.2:0.002097484776)97.2:0.00903484713)69.8:0.003370519292)78.4:0.007356409105)NA:0.009201575525,((T383:0.04021423612,(T315:0.03770249896,(T327:0.03623304633,(T314:0.03335792608,(T350:0.02719350556,(T326:0.02499990212,T316:0.02499990212)51.4:0.002193603441)63:0.006164420517)NA:0.002875120251)NA:0.001469452638)NA:0.002511737157)NA:0.002049479242,((T336:0.03397985113,T335:0.03397985113)52.2:0.007657313317,((T293:0.03673337523,T294:0.03673337523)NA:0.003431753654,(T339:0.03759782302,((T341:0.0329322193,(T322:0.03085915211,T353:0.03085915211)NA:0.002073067194)NA:0.002279320109,(T305:0.03344204163,((T330:0.01977384193,T331:0.01977384193)85.8:0.01187730301,(T296:0.03054288137,(T313:0.02989221314,(T354:0.0280581376,((T323:0.01516032455,T324:0.01516032455)97:0.01203700762,(T301:0.026166516,(T317:0.02351754268,(T309:0.02270796281,(T365:0.02137913519,(T320:0.01958552417,((T311:0.01356829158,(T321:0.009797676679,T312:0.009797676679)61.8:0.003770614898)NA:0.003676194746,(T318:0.01508760228,(T300:0.0125242839,T319:0.0125242839)NA:0.002563318377)NA:0.002156884042)NA:0.002341037848)NA:0.001793611024)NA:0.001328827615)NA:0.0008095798715)NA:0.002648973322)NA:0.001030816159)NA:0.0008608054395)NA:0.001834075539)NA:0.0006506682255)NA:0.001108263573)NA:0.00179089669)NA:0.001769497782)NA:0.002386283614)NA:0.002567305862)NA:0.00147203556)NA:0.0006265509183)NA:0.002085391595)NA:0.002182196133)NA:0.0001782341272)NA:0.009820716977,(T346:0.0495707188,(T295:0.04571189054,(T345:0.01766548982,T344:0.01766548982)100:0.02804640071)NA:0.003858828266)NA:0.006959535394)76:0.09488063596,((D374:0.06757002932,(((D375:0.05918301776,((D382:0.04596651155,(D370:0.041631059,(D379:0.03782293287,D380:0.03782293287)NA:0.003808126134)NA:0.00433545255)NA:0.005226771849,(D343:0.04830257484,D381:0.04830257484)NA:0.002890708563)NA:0.007989734355)NA:0.004117140923,((D371:0.05386095334,(D355:0.05137310534,(D307:0.04461225596,(D372:0.04306423971,(D340:0.04045263878,(D378:0.02204658188,(D306:0.013766427,D334:0.013766427)94.8:0.008280154877)99.6:0.0184060569)NA:0.002611600934)NA:0.001548016246)NA:0.006760849384)NA:0.002487848003)NA:0.006285195256,(D364:0.05655555988,(D361:0.05309108956,(D363:0.05018925118,(D347:0.03988672339,(D360:0.03295148181,(D357:0.02096263942,D356:0.02096263942)82.6:0.01198884239)63.8:0.006935241578)NA:0.01030252779)NA:0.002901838384)NA:0.003464470319)NA:0.003590588718)NA:0.003154010077)NA:0.003456015528,((D349:0.05771473154,D385:0.05771473154)NA:0.006786118672,((D332:0.05363855272,((D348:0.03993633123,D368:0.03993633123)NA:0.009226437513,(D377:0.04161734159,D384:0.04161734159)NA:0.007545427161)NA:0.00447578397)NA:0.009447857247,(D351:0.05392687597,(D338:0.04996253855,(D373:0.04626522502,(D362:0.03580684431,D376:0.03580684431)NA:0.01045838071)NA:0.003697313523)NA:0.003964337426)NA:0.009159533991)NA:0.001414440249)NA:0.002255323993)NA:0.0008138551137)NA:0.006440065628,((D369:0.01432086646,D367:0.01432086646)100:0.0566870592,((D303:0.01330830153,D302:0.01330830153)100:0.04900934321,(D329:0.0477603575,(D328:0.04072757461,D333:0.04072757461)78.6:0.007032782889)NA:0.01455728724)NA:0.008690280914)NA:0.003002169292)76:0.07740079521);"
    
    var tree_df = rectangleLayout(readTree(treestring));

    var width = 700,
        height = 1000;
    
    var scale = 0.2

    
    var xScale = d3.scaleLinear()
           .domain([-scale/2, scale/2])
           .range([0, width]);
    
    var yScale = d3.scaleLinear()
                 .domain([-scale,scale])
                 .range([height, 0])
    
    var svg = d3.select("#vis")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);

    // create a grouping variable 

    var group = svg.append("g");

    // zoom instead
    function zoomed() {
        group.attr("transform", d3.event.transform);
    }
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", zoomed));

    var stroke_width = 3;
    // draw horizontal lines
  group.append("g")
  .attr("class", "phylo_lines")
  .selectAll("lines")
  .data(tree_df.horizontal_lines)
  .join("line")
  .attr("class", "lines")
  .attr("x1", d => xScale(d.x0) - stroke_width/2)
  .attr("y1", d => yScale(d.y0))
  .attr("x2", d => xScale(d.x1) - stroke_width/2)
  .attr("y2", d => yScale(d.y1))
  .attr("stroke-width", stroke_width)
  .attr("stroke", "#777");


    // draw radii
    group.append("g")
        .attr("class", "phylo_lines")
        .selectAll("lines")
        .data(tree_df.radii)
        .join("line")
        .attr("class", "lines")
        .attr("x1", d => xScale(d.x0))
        .attr("y1", d => yScale(d.y0))
        .attr("x2", d => xScale(d.x1))
        .attr("y2", d => yScale(d.y1))
        .attr("stroke-width", stroke_width)
        .attr("stroke", "#777");

    const tooltip = d3.select("body").append("div")
        .attr("class", "svg-tooltip")
        .attr("class", "tiplabs")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "black")

// draw vertical lines
group.append("g")
.attr("class", "phylo_lines")
.selectAll("lines")
.data(tree_df.vertical_lines)
.join("line")
.attr("class", "lines")
.attr("x1", d => xScale(d.x0))
.attr("y1", d => yScale(d.y0))
.attr("x2", d => xScale(d.x1))
.attr("y2", d => yScale(d.y1))
.attr("stroke-width", stroke_width)
.attr("stroke", "#777");

// draw nodes
group.append("g")
.attr("class", "phylo_points")
.selectAll(".dot")
// remove rogue dot.
.data(tree_df.horizontal_lines.filter(d => d.x1 > 0))
.join("circle")
.attr("class", "dot")
.attr("r", function(d) {
 if (d.isTip) {
   return(4);
 } else {
   return(3);
 }
})
.attr("cx", d => xScale(d.x1))
.attr("cy", d => yScale(d.y1))
.attr("stroke", "black")
.attr("stroke-width", 2)
.attr("fill", function(d) {
 if (d.isTip) {
   return("black");
 } else {
   return("white");
 };
})
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (d) {
            return tooltip
                .style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("color", "white")
                .text(tree_df => d.thisLabel)
        })
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });

        svg.node()
})()