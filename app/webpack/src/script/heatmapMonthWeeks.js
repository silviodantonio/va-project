import * as d3 from 'd3';
import {WEEK_DAY_LIST, WEEK_DAY_DICTIONARY, MONTH_LIST} from './constants.js';

export default function main () {
  const margin = { top: 35, right: 45, bottom: 35, left: 85 },
        width = 350 - margin.left - margin.right,
        height = 260 - margin.top - margin.bottom;

  const svg = d3.select("#heatmap-month-week")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  d3.csv("http://127.0.0.1:7000/accidents_regions_complete.csv").then(data => {

    // const week_day_list = [
    //   "Dom", "Lun", "Mar",
    //   "Mer", "Gio", "Ven", "Sab"
    // ];

    // const week_day_dictionary = {
    //   "Dom": "Domenica", "Lun": "Lunedì", "Mar": "Martedì",
    //   "Mer": "Mercoledì", "Gio": "Giovedì", "Ven": "Venerdì", "Sab": "Sabato"
    // };

    // const month_list = [
    //   "Gennaio", "Febbraio", "Marzo", "Aprile",
    //   "Maggio", "Giugno", "Luglio", "Agosto",
    //   "Settembre", "Ottobre", "Novembre", "Dicembre"
    // ];

    /* -------------------- ROLLUP -------------------- */

    const valuemap = d3.rollup(
      data,
      v => v.length, // count accidents
      d => WEEK_DAY_LIST[+d.week_day - 1],
      d => MONTH_LIST[+d.month - 1]
    );

    /* ---- convert Map -> array for the heatmap ---- */

    const heatmapData = [];
    valuemap.forEach((monthMap, week_day) => {
        monthMap.forEach((value, month) => {
            const week_day_label = WEEK_DAY_DICTIONARY[week_day];
            heatmapData.push({ week_day, week_day_label, month, value });
        });
    });

    /* -------------------- SCALES -------------------- */

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
      .domain(MONTH_LIST)
      .padding(0.05);

    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    /* -------------------- COLOR -------------------- */

    const maxValue = d3.max(heatmapData, d => d.value);
    const minValue = d3.min(heatmapData, d => d.value);

    // const myColor = d3.scaleSequential()
    //   .interpolator(d3.interpolateBlues)
    //   // .domain([minValue, maxValue]);
    //   .domain([0, maxValue]);

    const myColor = d3.scaleQuantize()
        .domain([minValue, maxValue])
        .range(d3.schemeBlues[7]);

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


    // removed because of multi-selection

    // const mouseover = function () {
    //   tooltip.style("opacity", 1);
    //   d3.select(this).style("stroke", "black");
    // };

    const mouseover = function (event, d) {
      tooltip.style("opacity", 1);
      if (!selectedCells.has(cellKey(d))) {
        d3.select(this).style("stroke", "black");
      }
    };
    

    const mousemove = function (event, d) {
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
    };
      // removed because of multi-selection

    // const mouseleave = function () {
    //   tooltip.style("opacity", 0);
    //   d3.select(this).style("stroke", "none");
    // };

    const mouseleave = function (event, d) {
       tooltip.style("opacity", 0);
        if (!selectedCells.has(cellKey(d))) {
            d3.select(this).style("stroke", "none");
          }
    };

    /* -------------------- MULTI-SELECTION -------------------- */
    // track selected squares
    const selectedCells = new Map();

    function cellKey(d) {
      return `${d.month}|${d.week_day}`;
    }

    function updateSelectionStyles() {
      svg.selectAll(".heatmap-cell-MonthWeeks")
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

    // map -> Array.prototype.map() so takes the selected array 
    // (all the selected cells) and creates a new array containing just the week_day of each cell.


    function dispatchMultiSelection() {
      const selected = Array.from(selectedCells.values());
      document.dispatchEvent(
        new CustomEvent("heatmap_month-weeks_multi-select", {
          detail: {
            cells: selected,
            months: selected.map(d => d.month),
            week_days: selected.map(d => d.week_day)
          }
        })
      );

        console.log(selected);
        console.log(selected.map(d => d.month));
        console.log(selected.map(d => d.week_day));
    }

    const cellClicked = function (event, d) {
      event.stopPropagation(); // prevent background clearing
      const key = cellKey(d);

      if (selectedCells.has(key)) selectedCells.delete(key);
      else selectedCells.set(key, d);

      updateSelectionStyles();
      dispatchMultiSelection();
    };
    /* -------------------- HEATMAP -------------------- */

    svg.selectAll("rect")
      .data(heatmapData, d => d.month + ":" + d.week_day)
      .join("rect")
      .attr("class", "heatmap-cell-MonthWeeks")
      .attr("x", d => x(d.week_day))
      .attr("y", d => y(d.month))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("ry", 4)
      .style("fill", d => myColor(d.value))
      .style("opacity", 0.85)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .on("click", cellClicked);
  });
}
