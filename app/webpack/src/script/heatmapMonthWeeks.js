import * as d3 from 'd3';
import { drawSeqLegends } from './legendUtils.js';
import {WEEK_DAY_LIST, WEEK_DAY_DICTIONARY, MONTH_LIST, REGION_LIST} from './constants.js';
import { selectionStore, updateSelection, computeActiveSelection } from "./selectionStore.js";

export default  async function main () {
  const margin = { top: 25, right: 65, bottom: 35, left: 65 },
        // width = 350 - margin.left - margin.right,
        // height = 260 - margin.top - margin.bottom;
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
    .attr("y", -5)  // Position above the chart (negative y moves up)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Incidenti per mese/settimana");
  // document.addEventListener("region-click", event => {
  //       const regionName = event.detail.regionName;
  
  //       const filteredData = heatmapDataSource.filter(
  //         d => d.region == (REGION_LIST.indexOf(regionName) +1)
  //       );
  //       drawHeatmap(filteredData, width, height, svg);
  //     });
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
    .padding(0.05);

  const xAxis = svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(0));

  xAxis.select(".domain").remove();

  xAxis.selectAll(".tick text")
    .style("cursor", "pointer")
    .on("click", (event, week_day) => {
      event.stopPropagation();
      selectColumn(week_day);
    });


  const y = d3.scaleBand()
    .range([height, 0])
    .domain(MONTH_LIST)
    .padding(0.05);

  const yAxis = svg.append("g")
    .call(d3.axisLeft(y).tickSize(0));

  yAxis.select(".domain").remove();

  yAxis.selectAll(".tick text")
    .style("cursor", "pointer")
    .on("click", (event, month) => {
      event.stopPropagation();
      selectRow(month);
    });


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


/* -------------------- MULTI-SELECTION -------------------- */
  const selectedRows = new Set();     // months
  const selectedColumns = new Set();  // week_days
  const selectedCells = new Map();


  function cellKey(d) {
    return `${d.month}|${d.week_day}`;
  }

  function updateSelectionStyles() {
    const hasSelection = selectedCells.size > 0;

    svg.selectAll(".heatmap-cell-MonthWeeks")
      .style("opacity", d =>
        !hasSelection || selectedCells.has(cellKey(d)) ? 0.9 : 0.25
      )
      .style("stroke", d =>
        hasSelection && selectedCells.has(cellKey(d)) ? "#000" : "none"
      )
      .style("stroke-width", d =>
        hasSelection && selectedCells.has(cellKey(d)) ? 2 : 0
      );
  }


  function recomputeSelectedCells() {
    selectedCells.clear();

    // Only compute selected cells if something is actually selected
    if (selectedRows.size > 0 || selectedColumns.size > 0) {
      heatmapData.forEach(d => {
        const rowMatch = selectedRows.size === 0 || selectedRows.has(d.month);
        const colMatch = selectedColumns.size === 0 || selectedColumns.has(d.week_day);

        if (rowMatch && colMatch) {
          selectedCells.set(cellKey(d), d);
        }
      });
    }

    updateSelectionStyles();
    dispatchSelectionToStore();
  }



  function dispatchSelectionToStore() {
    if (selectedCells.size === 0) {
      updateSelection("heatmap_month_weeks", null);
      return;
    }

    const ids = new Set();
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

    updateSelection("heatmap_month_weeks", ids);
  }

const cellClicked = function(event, d) {
  event.stopPropagation();

  if (selectionStore.pca != null) {
    document.dispatchEvent(new CustomEvent("clear-pca-brush"));
  }

  // Toggle row
  selectedRows.has(d.month)
    ? selectedRows.delete(d.month)
    : selectedRows.add(d.month);

  // Toggle column
  selectedColumns.has(d.week_day)
    ? selectedColumns.delete(d.week_day)
    : selectedColumns.add(d.week_day);

  recomputeSelectedCells();
};


    d3.select("#heatmap-month-week").on("click", (event) => {
      if (!event.target.classList.contains("heatmap-cell-MonthWeeks")) {
        selectedRows.clear();
        selectedColumns.clear();
        selectedCells.clear();
        updateSelectionStyles();   // now properly removes black borders
        updateSelection("heatmap_month_weeks", null);
      }
    });


  /*------------------LABEL SELECTION------------------*/
  function selectColumn(week_day) {
  selectedColumns.has(week_day)
    ? selectedColumns.delete(week_day)
    : selectedColumns.add(week_day);

  recomputeSelectedCells();
}

function selectRow(month) {
  selectedRows.has(month)
    ? selectedRows.delete(month)
    : selectedRows.add(month);

  recomputeSelectedCells();
}


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
      if (!selectedCells.has(cellKey(d))) {
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
      if (!selectedCells.has(cellKey(d))) {
        d3.select(this).style("stroke", "none");
      }
    })
    .on("click", cellClicked);

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

  // -------------------- REACT TO SELECTION --------------------
  document.addEventListener("selection-changed", (event) => {
    const { store } = event.detail;

    // Reset local UI if selection comes from PCA
    if (selectionStore.heatmap_month_weeks === null) {
        selectedRows.clear();
        selectedColumns.clear();
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