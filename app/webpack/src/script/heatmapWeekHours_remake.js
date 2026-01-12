import * as d3 from 'd3';
import { WEEK_DAY_LIST, WEEK_DAY_DICTIONARY, HOUR_LIST } from './constants.js';
import { selectionStore, updateSelection, computeActiveSelection } from "./selectionStore.js";
import { drawSeqLegends } from './legendUtils.js';

export default async function main() {
  const margin = { top: 25, right: 65, bottom: 35, left: 65 },
        container = document.getElementById("heatmap-week-hours"),
        width = container.clientWidth - margin.left - margin.right,
        height = container.clientHeight - margin.top - margin.bottom;

  const svg = d3.select("#heatmap-week-hours")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // -------------------- LOAD DATA --------------------
  let rawData = await d3.csv(
    "http://127.0.0.1:7000/accidents_region_pca.csv",
    (d, i) => ({ ...d, id: i })
  );

  drawHeatmap(rawData, width, height, svg);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Incidenti per settimana/ora");
}


function drawHeatmap(rawData, width, height, svg){
  svg.selectAll("*").remove();

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

  const xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .style("cursor", "pointer")
    .select(".domain").remove();

  const y = d3.scaleBand()
    .range([height, 0])
    .domain(HOUR_LIST)
    .padding(0.05);

  const yAxis = svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .style("cursor", "pointer")
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

  // -------------------- SELECTION STATE --------------------
  const selectedCells = new Map();  // For individual cell selection
  const selectedRows = new Set();   // For hour (row) selection
  const selectedCols = new Set();   // For week_day (column) selection

  function cellKey(d) {
    return `${d.week_day}|${d.hour}`;
  }

  function isCellSelected(d) {
    const key = cellKey(d);
    
    // Check if cell is individually selected
    if (selectedCells.has(key)) return true;
    
    // Check if cell is in selected row (hour)
    if (selectedRows.has(d.hour)) return true;
    
    // Check if cell is in selected column (weekday)
    if (selectedCols.has(d.week_day)) return true;
    
    return false;
  }

  function updateSelectionStyles() {
    // Update cell styles
    svg.selectAll(".heatmap-cell-WeekHours")
      .style("opacity", d => {
        if (selectedCells.size === 0 && selectedRows.size === 0 && selectedCols.size === 0) {
          return 0.85;
        }
        return isCellSelected(d) ? 0.9 : 0.25;
      })
      .style("stroke", d => isCellSelected(d) ? "#000" : "none")
      .style("stroke-width", d => isCellSelected(d) ? 2 : 0);

    // Update row label styles (hours)
    svg.selectAll(".y-axis .tick text")
      .style("font-weight", d => selectedRows.has(d) ? "bold" : "normal")
      .style("fill", d => selectedRows.has(d) ? "#e6550d" : "#000")
      .style("cursor", "pointer");

    // Update column label styles (weekdays)
    svg.selectAll(".x-axis .tick text")
      .style("font-weight", d => selectedCols.has(d) ? "bold" : "normal")
      .style("fill", d => selectedCols.has(d) ? "#e6550d" : "#000")
      .style("cursor", "pointer");
  }

  function dispatchSelectionToStore() {
    if (selectedCells.size === 0 && selectedRows.size === 0 && selectedCols.size === 0) {
      updateSelection("heatmap_week_hours", null);
      return;
    }

    const ids = new Set();

    // Add IDs from individual cell selection
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

    // Add IDs from row selection (all cells in selected hours)
    for (const hour of selectedRows) {
      for (const d of rawData) {
        if (HOUR_LIST[+d.hour - 1] === hour) {
          ids.add(d.id);
        }
      }
    }

    // Add IDs from column selection (all cells in selected weekdays)
    for (const week_day of selectedCols) {
      for (const d of rawData) {
        if (WEEK_DAY_LIST[+d.week_day - 1] === week_day) {
          ids.add(d.id);
        }
      }
    }

    updateSelection("heatmap_week_hours", ids);
  }

  /* -------------------- SELECTION HANDLERS -------------------- */
  
  // Individual cell click handler
  const cellClicked = function(event, d) {
    event.stopPropagation();

    if (selectionStore.pca != null) {
        document.dispatchEvent(new CustomEvent("clear-pca-brush"));
    }
    const key = cellKey(d);

    // Toggle individual cell selection
    if (selectedCells.has(key)) {
      selectedCells.delete(key);
    } else {
      selectedCells.set(key, d);
    }
    
    // Clear row/col selections when selecting individual cells
    // selectedRows.clear();
    // selectedCols.clear();

    updateSelectionStyles();
    dispatchSelectionToStore();
  };

  // Row label click handler (hours)
  const rowLabelClicked = function(event, hour) {
    event.stopPropagation();

    if (selectionStore.pca != null) {
      document.dispatchEvent(new CustomEvent("clear-pca-brush"));
    }

    // Toggle row selection
    if (selectedRows.has(hour)) {
      selectedRows.delete(hour);
    } else {
      selectedRows.add(hour);
    }
    
    // Clear individual cell and column selections when selecting rows
    // selectedCells.clear();
    // selectedCols.clear();

    updateSelectionStyles();
    dispatchSelectionToStore();
  };

  // Column label click handler (weekdays)
  const colLabelClicked = function(event, week_day) {
    event.stopPropagation();

    if (selectionStore.pca != null) {
      document.dispatchEvent(new CustomEvent("clear-pca-brush"));
    }

    // Toggle column selection
    if (selectedCols.has(week_day)) {
      selectedCols.delete(week_day);
    } else {
      selectedCols.add(week_day);
    }
    
    // Clear individual cell and row selections when selecting columns
    // selectedCells.clear();
    // selectedRows.clear();

    updateSelectionStyles();
    dispatchSelectionToStore();
  };

  // Clear all selections on background click
  d3.select("#heatmap-week-hours").on("click", (event) => {
    if (!event.target.classList.contains("heatmap-cell-WeekHours") &&
        !event.target.classList.contains("tick")) {
      selectedCells.clear();
      selectedRows.clear();
      selectedCols.clear();
      updateSelectionStyles();
      updateSelection("heatmap_week_hours", null);
    }
  });

  // -------------------- ROLLUP (FIXED) --------------------
  function computeHeatmapData(sourceData) {
    const valuemap = d3.rollup(
      sourceData,
      v => d3.sum(v, d => +d.observation),
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

  const minValue = 0;
  const maxValue = d3.max(initialHeatmapData, d => d.value);
  myColor.domain([minValue, maxValue]);

  svg.selectAll(".heatmap-cell-WeekHours")
    .data(initialHeatmapData, d => d.week_day + ":" + d.hour)
    .join("rect")
    .attr("class", "heatmap-cell-WeekHours")
    .style('cursor', 'pointer')
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
      if (!isCellSelected(d)) d3.select(this).style("stroke", "black");
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
      if (!isCellSelected(d)) d3.select(this).style("stroke", "none");
    })
    .on("click", cellClicked);

  // Add click handlers to row labels (hours)
  svg.selectAll(".y-axis .tick")
    .on("click", rowLabelClicked);

  // Add click handlers to column labels (weekdays)
  svg.selectAll(".x-axis .tick")
    .on("click", colLabelClicked);

  drawSeqLegends(svg, width + 15, 0,
    minValue, maxValue, myColor.range().length,
    myColor
  )

  // -------------------- UPDATE (NO JOIN) --------------------
  function updateHeatmap(filteredData) {
    const heatmapData = computeHeatmapData(filteredData);

    const minValue = 0;
    const maxValue = d3.max(heatmapData, d => d.value);
    myColor.domain([minValue, maxValue]);

    svg.selectAll(".heatmap-cell-WeekHours")
      .data(heatmapData, d => d.week_day + ":" + d.hour)
      .transition()
      .duration(400)
      .style("fill", d => myColor(d.value));

    drawSeqLegends(svg, width + 15, 0,
      minValue, maxValue, myColor.range().length,
      myColor
    )
  }

  // -------------------- REACT TO SELECTION --------------------
  document.addEventListener("selection-changed", (event) => {
    const { store } = event.detail;

    // Reset local UI only if the store says this selection is null
    if (store.heatmap_week_hours === null) {
      selectedCells.clear();
      selectedRows.clear();
      selectedCols.clear();
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