import * as d3 from 'd3';

export default function main () {
  const margin = { top: 35, right: 45, bottom: 35, left: 85 },
        width = 350 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

  const svg = d3.select("#chart-region")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  d3.csv("http://127.0.0.1:7000/accidents_regions_complete.csv").then(data => {

    const week_day_list = [
      "Dom", "Lun", "Mar",
      "Mer", "Gio", "Ven", "Sab"
    ];

    const week_day_dictionary = {
      "Dom": "Domenica", "Lun": "Lunedì", "Mar": "Martedì",
      "Mer": "Mercoledì", "Gio": "Giovedì", "Ven": "Venerdì", "Sab": "Sabato"
    };

    const month_list = [
      "Gennaio", "Febbraio", "Marzo", "Aprile",
      "Maggio", "Giugno", "Luglio", "Agosto",
      "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    /* -------------------- ROLLUP -------------------- */

    const valuemap = d3.rollup(
      data,
      v => v.length, // count accidents
      d => week_day_list[+d.week_day - 1],
      d => month_list[+d.month - 1]
    );

    /* ---- convert Map -> array for the heatmap ---- */

    const heatmapData = [];
    valuemap.forEach((monthMap, week_day) => {
        monthMap.forEach((value, month) => {
            const week_day_label = week_day_dictionary[week_day];
            heatmapData.push({ week_day, week_day_label, month, value });
        });
    });

    /* -------------------- SCALES -------------------- */

    const x = d3.scaleBand()
      .range([0, width])
      .domain(week_day_list)
      .padding(0.05);

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select(".domain").remove();

    const y = d3.scaleBand()
      .range([height, 0])
      .domain(month_list)
      .padding(0.05);

    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    /* -------------------- COLOR -------------------- */

    const maxValue = d3.max(heatmapData, d => d.value);
    // const minValue = d3.min(heatmapData, d => d.value);

    // const myColor = d3.scaleSequential()
    //   .interpolator(d3.interpolateBlues)
    //   // .domain([minValue, maxValue]);
    //   .domain([0, maxValue]);

    const myColor = d3.scaleQuantize()
        .domain([0, maxValue])
        .range(d3.schemeBlues[9]);

    /* -------------------- TOOLTIP -------------------- */

    const tooltip = d3.select("#chart-region")
      .append("div")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background-color", "white")
      .style("border", "2px solid")
      .style("border-radius", "5px")
      .style("padding", "5px");

    const mouseover = function () {
      tooltip.style("opacity", 1);
      d3.select(this).style("stroke", "black");
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

    const mouseleave = function () {
      tooltip.style("opacity", 0);
      d3.select(this).style("stroke", "none");
    };

    /* -------------------- HEATMAP -------------------- */

    svg.selectAll("rect")
      .data(heatmapData, d => d.month + ":" + d.week_day)
      .join("rect")
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
      .on("mouseleave", mouseleave);
  });
}
