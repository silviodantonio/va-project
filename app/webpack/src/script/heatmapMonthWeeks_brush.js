import * as d3 from 'd3';
import { drawSeqLegends } from './legendUtils.js';
import {WEEK_DAY_LIST, WEEK_DAY_DICTIONARY, MONTH_LIST, REGION_LIST} from './constants.js';
import { selectionStore, updateSelection, computeActiveSelection } from "./selectionStore.js";

export default async function main () {
  const margin = { top: 25, right: 65, bottom: 35, left: 65 },
        container = document.getElementById("heatmap-month-week"),
        width = container.clientWidth - margin.left - margin.right,
        height = container.clientHeight - margin.top - margin.bottom;

  const svg = d3.select("#heatmap-month-week")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  let heatmapDataSource;

  const rawData = await d3.csv(
    "http://127.0.0.1:7000/accidents_region_pca.csv",
    (d, i) => ({ ...d, id: i })
  );
  heatmapDataSource = rawData;

  // Build cell-to-IDs map once
  const cellToIds = new Map();
  for (const d of rawData) {
    const key = `${MONTH_LIST[+d.month - 1]}|${WEEK_DAY_LIST[+d.week_day - 1]}`;
    if (!cellToIds.has(key)) cellToIds.set(key, new Set());
    cellToIds.get(key).add(d.id);
  }

  // Pass cellToIds explicitly
  drawHeatmap(rawData, width, height, svg, cellToIds);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Incidenti per mese/settimana");
}

function drawHeatmap(rawData, width, height, svg, cellToIds) {
  svg.selectAll("*").remove();

  const ALL_CELLS = [];
  for (const month of MONTH_LIST) {
    for (const week_day of WEEK_DAY_LIST) {
      ALL_CELLS.push({ month, week_day, week_day_label: WEEK_DAY_DICTIONARY[week_day], value: 0 });
    }
  }

  const x = d3.scaleBand().range([0, width]).domain(WEEK_DAY_LIST).padding(0.05);
  const y = d3.scaleBand().range([height, 0]).domain(MONTH_LIST).padding(0.05);
  const cellArea = x.bandwidth() * y.bandwidth();

  svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).tickSize(0)).select(".domain").remove();
  svg.append("g").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

  const tooltip = d3.select("#heatmap-month-week").append("div")
    .style("opacity", 0).style("position", "absolute").style("pointer-events", "none")
    .style("background-color", "white").style("border", "2px solid").style("border-radius", "5px")
    .style("padding", "5px");

  function computeHeatmapData(sourceData) {
    const valuemap = d3.rollup(
      sourceData,
      v => d3.sum(v, d => +d.observation),
      d => MONTH_LIST[+d.month - 1],
      d => WEEK_DAY_LIST[+d.week_day - 1]
    );

    return ALL_CELLS.map(cell => ({
      ...cell,
      value: valuemap.get(cell.month)?.get(cell.week_day) ?? 0
    }));
  }

  let heatmapData = computeHeatmapData(rawData);
  const maxValue = d3.max(heatmapData, d => d.value);
  const minValue = d3.min(heatmapData, d => d.value);
  const myColor = d3.scaleQuantize().domain([minValue, maxValue]).range(d3.schemeBlues[7]);

  const selectedCells = new Map();
  const cellKey = d => `${d.month}|${d.week_day}`;

  function updateSelectionStyles() {
    svg.selectAll(".heatmap-cell-MonthWeeks")
      .style("opacity", d => selectedCells.size === 0 || selectedCells.has(cellKey(d)) ? 0.9 : 0.25)
      .style("stroke", d => selectedCells.has(cellKey(d)) ? "#000" : "none")
      .style("stroke-width", d => selectedCells.has(cellKey(d)) ? 2 : 0);
  }

  function dispatchSelectionToStore() {
    if (selectedCells.size === 0) { updateSelection("heatmap_month_weeks", null); return; }
    const ids = new Set();
    for (const key of selectedCells.keys()) {
      const cellIds = cellToIds.get(key);
      if (cellIds) for (const id of cellIds) ids.add(id);
    }
    updateSelection("heatmap_month_weeks", ids);
  }

  const cellClicked = function(event, d) {
    event.stopPropagation();
    if (selectionStore.pca != null) document.dispatchEvent(new CustomEvent("clear-pca-brush"));
    const key = cellKey(d);
    if (selectedCells.has(key)) selectedCells.delete(key);
    else selectedCells.set(key, d);
    updateSelectionStyles();
    dispatchSelectionToStore();
  };

  function cellBounds(d) {
    return { x0: x(d.week_day), y0: y(d.month), x1: x(d.week_day) + x.bandwidth(), y1: y(d.month) + y.bandwidth() };
  }

  function intersectionArea(a, b) {
    const x0 = Math.max(a.x0, b.x0), y0 = Math.max(a.y0, b.y0),
          x1 = Math.min(a.x1, b.x1), y1 = Math.min(a.y1, b.y1);
    return Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  }

  svg.selectAll("rect")
    .data(heatmapData, d => d.month + ":" + d.week_day)
    .join("rect")
    .attr("class", "heatmap-cell-MonthWeeks")
    .style('cursor', 'pointer')
    .attr("x", d => x(d.week_day))
    .attr("y", d => y(d.month))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 4).attr("ry", 4)
    .style("fill", d => myColor(d.value))
    .style("opacity", 0.85)
    .on("mouseover", function (event, d) { tooltip.style("opacity", 1); if (!selectedCells.has(cellKey(d))) d3.select(this).style("stroke", "black"); })
    .on("mousemove", function (event, d) {
      const [mx, my] = d3.pointer(event, document.body);
      const bgColor = myColor(d.value);
      const rgb = d3.color(bgColor);
      const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      const textColor = brightness < 140 ? "white" : "black";
      tooltip.html(`<strong>${d.month}</strong><br>${d.week_day_label}<br>Incidenti: ${d.value}`)
        .style("background-color", bgColor).style("color", textColor)
        .style("left", (mx+10)+"px").style("top",(my+10)+"px");
    })
    .on("mouseleave", function (event,d){ tooltip.style("opacity",0); if(!selectedCells.has(cellKey(d))) d3.select(this).style("stroke","none"); });

  /* -------------------- BRUSH -------------------- */
  const brushG = svg.append("g").attr("class","heatmap-brush");
  const brush = d3.brush().extent([[0,0],[width,height]]);

  let rafId = null;
  brush.on("brush", (event) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => handleBrush(event));
  });
  brush.on("end", handleBrush);
  brushG.call(brush);

  function handleBrush(event) {
    if (!event.selection) { selectedCells.clear(); updateSelectionStyles(); updateSelection("heatmap_month_weeks", null); return; }

    const [[x0,y0],[x1,y1]] = event.selection;
    const brushRect = {x0,y0,x1,y1};
    selectedCells.clear();

    svg.selectAll(".heatmap-cell-MonthWeeks")
      .each(function(d){
        if(intersectionArea(brushRect, cellBounds(d)) > 0)
          selectedCells.set(cellKey(d), d);
      });

    updateSelectionStyles();
    dispatchSelectionToStore();

    if(event.type === "end") {
      const xs=[],ys=[];
      for(const d of selectedCells.values()){ const b=cellBounds(d); xs.push(b.x0,b.x1); ys.push(b.y0,b.y1); }
      brushG.transition().duration(200).call(brush.move, [[d3.min(xs),d3.min(ys)],[d3.max(xs),d3.max(ys)]]);
    }
  }

  drawSeqLegends(svg, width+15,0,minValue,maxValue,myColor.range().length,myColor);

  function updateHeatmap(newData) {
    const newHeatmapData = computeHeatmapData(newData);
    const maxValue = d3.max(newHeatmapData, d => d.value);
    const minValue = d3.min(newHeatmapData, d => d.value);

    myColor.domain([minValue,maxValue]);
    svg.selectAll(".heatmap-cell-MonthWeeks").data(newHeatmapData,d=>d.month+":"+d.week_day)
      .transition().duration(400).style("fill",d=>myColor(d.value));
    drawSeqLegends(svg,width,0,minValue,maxValue,myColor.range().length,myColor);
  }

  document.addEventListener("selection-changed", (event) => {
    const {store}=event.detail;
    if(selectionStore.heatmap_month_weeks===null){selectedCells.clear();updateSelectionStyles();}
    const activeSelection=computeActiveSelection(store);
    if(activeSelection&&activeSelection.size>0) updateHeatmap(rawData.filter(d=>activeSelection.has(d.id)));
    else updateHeatmap(rawData);
  });

  // Deselect on click outside
  d3.select("#heatmap-month-week").on("click", (event)=>{
    if(!event.target.classList.contains("heatmap-cell-MonthWeeks")){
      selectedCells.clear();
      updateSelectionStyles();
      updateSelection("heatmap_month_weeks", null);
      brushG.call(brush.move, null); // clear brush
    }
  });
}

