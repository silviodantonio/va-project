import * as d3 from 'd3';
import { drawSeqLegends } from './legendUtils.js';
import {WEEK_DAY_LIST, WEEK_DAY_DICTIONARY, MONTH_LIST, REGION_LIST} from './constants.js';
import { selectionStore, updateSelection, computeActiveSelection } from "./selectionStore.js";

export default  async function main () {
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
  let rawData = await d3.csv(
    "http://127.0.0.1:7000/accidents_region_pca.csv",
    (d, i) => ({ ...d, id: i })
  );
  heatmapDataSource = rawData;

  drawHeatmap(rawData, width, height, svg);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Incidenti per mese/settimana");
}

function drawHeatmap(rawData, width, height, svg){
  svg.selectAll("*").remove();
  
  // -------------------- FULL GRID --------------------
  const ALL_CELLS = [];
  for (const month of MONTH_LIST) {
    for (const week_day of WEEK_DAY_LIST) {
      ALL_CELLS.push({
        month,
        week_day,
        week_day_label: WEEK_DAY_DICTIONARY[week_day],
        value: 0
      });
    }
  }

  /* -------------------- SCALES -------------------- */
  const x = d3.scaleBand()
    .range([0, width])
    .domain(WEEK_DAY_LIST)
    .padding(0.05);    // selectedRows.clear();
    // selectedCols.clear();


  const xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .style("cursor", "pointer")
    .call(d3.axisBottom(x).tickSize(0))
    .select(".domain").remove();

  const y = d3.scaleBand()
    .range([height, 0])
    .domain(MONTH_LIST)
    .padding(0.05);

  const yAxis = svg.append("g")
    .attr("class", "y-axis")
    .style("cursor", "pointer")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove();

  /* -------------------- TOOLTIP -------------------- */
  const tooltip = d3.select("#heatmap-month-week")
    .append("div")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background-color", "white")
    .style("border", "2px solid")
    .style("border-radius", "5px")
    .style("padding", "5px");

  /* -------------------- COMPUTE HEATMAP DATA -------------------- */
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

  // Compute initial heatmap data from rawData
  let heatmapData = computeHeatmapData(rawData);
  
  /* -------------------- COLOR -------------------- */
  const maxValue = d3.max(heatmapData, d => d.value);
  const minValue = d3.min(heatmapData, d => d.value);

  const myColor = d3.scaleQuantize()
    .domain([minValue, maxValue])
    .range(d3.schemeBlues[7]);

  /* -------------------- SELECTION STATE -------------------- */
  const selectedCells = new Map(); // For individual cell selection
  const selectedRows = new Set();  // For month (row) selection
  const selectedCols = new Set();  // For week_day (column) selection

  function cellKey(d) {
    return `${d.month}|${d.week_day}`;
  }

  function isCellSelected(d) {
    const key = cellKey(d);
    
    // Check if cell is individually selected
    if (selectedCells.has(key)) return true;
    
    // Check if cell is in selected row
    if (selectedRows.has(d.month)) return true;
    
    // Check if cell is in selected column
    if (selectedCols.has(d.week_day)) return true;
    
    return false;
  }

  function updateSelectionStyles() {
    // Update cell styles
    svg.selectAll(".heatmap-cell-MonthWeeks")
         svg.selectAll(".heatmap-cell-MonthWeeks")
      .style("opacity", d => {
        if (selectedCells.size === 0 && selectedRows.size === 0 && selectedCols.size === 0) {
          return 0.85;
        }
        return isCellSelected(d) ? 0.9 : 0.25;
      })
      .style("stroke", d => isCellSelected(d) ? "#000" : "none")
      .style("stroke-width", d => isCellSelected(d) ? 2 : 0);

    // Update row label styles
    svg.selectAll(".y-axis .tick text")
      .style("font-weight", d =>  selectedRows.has(d) ? "bold" : "normal")
      .style("fill", d => selectedRows.has(d) ? "#e6550d" : "#000")
      .style("cursor", "pointer");

    // Update column label styles
    svg.selectAll(".x-axis .tick text")
      .style("font-weight", d => selectedCols.has(d) ? "bold" : "normal")
      .style("fill", d => selectedCols.has(d) ? "#e6550d" : "#000")
      .style("cursor", "pointer");
  }

  function dispatchSelectionToStore() {
    // If nothing is selected
    if (selectedCells.size === 0 && selectedRows.size === 0 && selectedCols.size === 0) {
      updateSelection("heatmap_month_weeks", null);
      return;
    }

    const ids = new Set();
    
    // Add IDs from individual cell selection
    for (const cell of selectedCells.values()) {
      for (const d of rawData) {
        if (
          MONTH_LIST[+d.month - 1] === cell.month &&
          WEEK_DAY_LIST[+d.week_day - 1] === cell.week_day
        ) {
          ids.add(d.id);
        }
      }
    }

    // Add IDs from row selection (all cells in selected months)
    for (const month of selectedRows) {
      for (const d of rawData) {
        if (MONTH_LIST[+d.month - 1] === month) {
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

    updateSelection("heatmap_month_weeks", ids);
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

  // Row label click handler
  const rowLabelClicked = function(event, month) {
    event.stopPropagation();

    if (selectionStore.pca != null) {
      document.dispatchEvent(new CustomEvent("clear-pca-brush"));
    }

    // Toggle row selection
    if (selectedRows.has(month)) {
      selectedRows.delete(month);
    } else {
      selectedRows.add(month);
    }
    
    // Clear individual cell and column selections when selecting rows
    // selectedCells.clear();
    // selectedCols.clear();

    updateSelectionStyles();
    dispatchSelectionToStore();
  };

  // Column label click handler
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
  d3.select("#heatmap-month-week").on("click", (event) => {
    if (!event.target.classList.contains("heatmap-cell-MonthWeeks") &&
        !event.target.classList.contains("tick")) {
      selectedCells.clear();
      selectedRows.clear();
      selectedCols.clear();
      updateSelectionStyles();
      updateSelection("heatmap_month_weeks", null);
    }
  });

  /* -------------------- INITIAL DRAW -------------------- */
  svg.selectAll("rect")
    .data(heatmapData, d => d.month + ":" + d.week_day)
    .join("rect")
    .attr("class", "heatmap-cell-MonthWeeks")
    .style('cursor', 'pointer')
    .attr("x", d => x(d.week_day))
    .attr("y", d => y(d.month))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("ry", 4)
    .style("fill", d => myColor(d.value))
    .style("opacity", 0.85)
    .on("mouseover", function (event, d) {
      tooltip.style("opacity", 1);
      if (!isCellSelected(d)) {
        d3.select(this).style("stroke", "black");
      }
    })
    .on("mousemove", function (event, d) {
      const [mx, my] = d3.pointer(event, document.body);
      const bgColor = myColor(d.value);
      const rgb = d3.color(bgColor);
      const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      const textColor = brightness < 140 ? "white" : "black";

      tooltip
        .html(
          `<strong>${d.month}</strong><br>
          ${d.week_day_label}<br>
          Incidenti: ${d.value}`
        )
        .style("background-color", bgColor)
        .style("color", textColor)
        .style("left", (mx + 10) + "px")
        .style("top", (my + 10) + "px");
    })
    .on("mouseleave", function (event, d) {
      tooltip.style("opacity", 0);
      if (!isCellSelected(d)) {
        d3.select(this).style("stroke", "none");
      }
    })
    .on("click", cellClicked);

  // Add click handlers to row labels
  svg.selectAll(".y-axis .tick")
    .on("click", rowLabelClicked);

  // Add click handlers to column labels
  svg.selectAll(".x-axis .tick")
    .on("click", colLabelClicked);

  // Draw legend
  drawSeqLegends(svg, width + 15, 0,
    minValue, maxValue, myColor.range().length,
    myColor);

  /* -------------------- UPDATE FUNCTION -------------------- */
  function updateHeatmap(newData) {
    const newHeatmapData = computeHeatmapData(newData);
    
    // Update color domain if needed
    const maxValue = d3.max(newHeatmapData, d => d.value);
    const minValue = d3.min(newHeatmapData, d => d.value);

    myColor.domain([minValue, maxValue]);
    
    // Update all rectangles
    svg.selectAll(".heatmap-cell-MonthWeeks")
      .data(newHeatmapData, d => d.month + ":" + d.week_day)
      .transition()
      .duration(400)
      .style("fill", d => myColor(d.value));

    // Update legends
    drawSeqLegends(svg, width, 0,
      minValue, maxValue, myColor.range().length,
      myColor);
  }

  // -------------------- REACT TO EXTERNAL SELECTION --------------------
  document.addEventListener("selection-changed", (event) => {
    const { store } = event.detail;

    // Reset local UI if selection comes from PCA
    if (selectionStore.heatmap_month_weeks === null) {
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