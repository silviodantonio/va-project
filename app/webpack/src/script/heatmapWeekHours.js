import * as d3 from 'd3';
import { WEEK_DAY_LIST, WEEK_DAY_DICTIONARY, HOUR_LIST } from './constants.js';
import { selectionStore, updateSelection, computeActiveSelection } from "./selectionStore.js";

export default async function main() {
  const margin = { top: 35, right: 45, bottom: 15, left: 55 },
        width = 350 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

  const svg = d3.select("#heatmap-week-hours")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // -------------------- LOAD DATA --------------------
  let rawData = await d3.csv(
    "http://127.0.0.1:7000/accidents_region_pca.csv",
    (d, i) => ({ ...d, id: i })
  );

  // -------------------- FULL GRID --------------------
  const ALL_CELLS = [];
  for (const week_day of WEEK_DAY_LIST) {
    for (const hour of HOUR_LIST) {
      ALL_CELLS.push({
        week_day,
        week_day_label: WEEK_DAY_DICTIONARY[week_day],
        hour,
        value: 0
      });
    }
  }

  // -------------------- SCALES --------------------
  const x = d3.scaleBand()
    .range([0, width])
    .domain(WEEK_DAY_LIST)
    .padding(0.05);

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .select(".domain").remove();

  const y = d3.scaleBand()
    .range([height, 0])
    .domain(HOUR_LIST)
    .padding(0.05);

  svg.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove();

  const myColor = d3.scaleQuantize()
    .range(d3.schemeBlues[7]);

  // -------------------- TOOLTIP --------------------
  const tooltip = d3.select("#heatmap-week-hours")
    .append("div")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background-color", "white")
    .style("border", "2px solid")
    .style("border-radius", "5px")
    .style("padding", "5px");

  // -------------------- MULTI-SELECTION --------------------
  const selectedCells = new Map();

  function cellKey(d) {
    return `${d.week_day}|${d.hour}`;
  }

  function updateSelectionStyles() {
    svg.selectAll(".heatmap-cell-WeekHours")
      .style("opacity", d =>
        selectedCells.size === 0 || selectedCells.has(cellKey(d)) ? 0.9 : 0.25
      )
      .style("stroke", d =>
        selectedCells.has(cellKey(d)) ? "#000" : "none"
      )
      .style("stroke-width", d =>
        selectedCells.has(cellKey(d)) ? 2 : 0
      );
  }

  function dispatchSelectionToStore() {
    if (selectedCells.size === 0) {
      updateSelection("heatmap_week_hours", null);
      return;
    }

    const ids = new Set();

    for (const cell of selectedCells.values()) {
      for (const d of rawData) {
        if (
          WEEK_DAY_LIST[+d.week_day - 1] === cell.week_day &&
          HOUR_LIST[+d.hour - 1] === cell.hour
        ) {
          ids.add(d.id);
        }
      }
    }

    updateSelection("heatmap_week_hours", ids);
  }

  const cellClicked = function(event, d) {
    event.stopPropagation();

    if (selectionStore.pca != null) {
        document.dispatchEvent(new CustomEvent("clear-pca-brush"));
    }
    const key = cellKey(d);

    if (selectedCells.has(key)) selectedCells.delete(key);
    else selectedCells.set(key, d);

    updateSelectionStyles();
    dispatchSelectionToStore();
  };

  d3.select("#heatmap-week-hours").on("click", (event) => {
    if (!event.target.classList.contains("heatmap-cell-WeekHours")) {
      selectedCells.clear();
      updateSelectionStyles();
      updateSelection("heatmap_week_hours", null);
    }
  });

  // -------------------- ROLLUP (FIXED) --------------------
  function computeHeatmapData(sourceData) {
    const valuemap = d3.rollup(
      sourceData,
      v => v.length,
      d => WEEK_DAY_LIST[+d.week_day - 1],
      d => HOUR_LIST[+d.hour - 1]
    );

    return ALL_CELLS.map(cell => ({
      ...cell,
      value:
        valuemap
          .get(cell.week_day)
          ?.get(cell.hour) ?? 0
    }));
  }

  // -------------------- INITIAL DRAW --------------------
  const initialHeatmapData = computeHeatmapData(rawData);

  myColor.domain([0, d3.max(initialHeatmapData, d => d.value)]);

  svg.selectAll(".heatmap-cell-WeekHours")
    .data(initialHeatmapData, d => d.week_day + ":" + d.hour)
    .join("rect")
    .attr("class", "heatmap-cell-WeekHours")
    .attr("x", d => x(d.week_day))
    .attr("y", d => y(d.hour))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("ry", 4)
    .style("fill", d => myColor(d.value))
    .style("opacity", 0.85)
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1);
      if (!selectedCells.has(cellKey(d))) d3.select(this).style("stroke", "black");
    })
    .on("mousemove", function(event, d) {
      const [mx, my] = d3.pointer(event, document.body);
      const bgColor = myColor(d.value);
      const rgb = d3.color(bgColor);
      const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      const textColor = brightness < 140 ? "white" : "black";

      tooltip
        .html(`<strong>${d.hour}</strong><br>${d.week_day_label}<br>Incidenti: ${d.value}`)
        .style("background-color", bgColor)
        .style("color", textColor)
        .style("left", (mx + 10) + "px")
        .style("top", (my + 10) + "px");
    })
    .on("mouseleave", function(event, d) {
      tooltip.style("opacity", 0);
      if (!selectedCells.has(cellKey(d))) d3.select(this).style("stroke", "none");
    })
    .on("click", cellClicked);

  // -------------------- UPDATE (NO JOIN) --------------------
  function updateHeatmap(filteredData) {
    const heatmapData = computeHeatmapData(filteredData);

    myColor.domain([0, d3.max(heatmapData, d => d.value)]);

    svg.selectAll(".heatmap-cell-WeekHours")
      .data(heatmapData, d => d.week_day + ":" + d.hour)
      .transition()
      .duration(400)
      .style("fill", d => myColor(d.value));
  }

  // -------------------- REACT TO SELECTION --------------------
  document.addEventListener("selection-changed", (event) => {
    const { store } = event.detail;

    // Reset local UI only if the store says this selection is null
    if (store.heatmap_week_hours === null) {
      selectedCells.clear();
      updateSelectionStyles();
    }

    const activeSelection = computeActiveSelection(store);

    if (activeSelection && activeSelection.size > 0) {
      updateHeatmap(rawData.filter(d => activeSelection.has(d.id)));
    } else {
      updateHeatmap(rawData);
    }
  });
}
