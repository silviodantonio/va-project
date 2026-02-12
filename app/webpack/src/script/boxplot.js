import * as d3 from 'd3';
import { INTERSECTION_LIST, ACCIDENT_TYPE_LIST, REGION_LIST, DEADLY_LIST } from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection, extractIDs } from "./selectionStore.js";

export default async function main() {

    const margin = { top: 25, right: 65, bottom: 35, left: 65 };
    const container = document.getElementById("boxplot");
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    const center = width / 2;
    const boxWidth = 100;

    // ---------- LOAD DATA ----------
    const rawData = await d3.csv(
        "http://127.0.0.1:7000/accidents_regions_complete.csv",
        (d, i) => ({
            id: i,
            observation: +d.observation
        })
    );

    // ---------- COMPUTE STATISTICS ----------
    const data_sorted = rawData
        .map(d => d.observation)
        .sort(d3.ascending);

    const q1 = d3.quantile(data_sorted, 0.25);
    const median = d3.quantile(data_sorted, 0.5);
    const q3 = d3.quantile(data_sorted, 0.75);
    const iqr = q3 - q1;

    const min = q1 - 1.5 * iqr;
    const max = q3 + 1.5 * iqr;

    // ---------- CREATE SVG ----------
    const svg = d3.create("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // ---------- Y SCALE ----------
    const y = d3.scaleLinear()
        .domain([min, max])
        .range([height, 0]);

    g.append("g")
        .call(d3.axisLeft(y));

    // ---------- WHISKER LINE ----------
    g.append("line")
        .attr("x1", center)
        .attr("x2", center)
        .attr("y1", y(min))
        .attr("y2", y(max))
        .attr("stroke", "black");

    // ---------- BOX ----------
    g.append("rect")
        .attr("x", center - boxWidth / 2)
        .attr("width", boxWidth)
        .attr("y", y(q3))
        .attr("height", y(q1) - y(q3))
        .attr("stroke", "black")
        .attr("fill", "#69b3a2");

    // ---------- MEDIAN LINE ----------
    g.append("line")
        .attr("x1", center - boxWidth / 2)
        .attr("x2", center + boxWidth / 2)
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("stroke", "black");

    // ---------- MIN & MAX CAPS ----------
    g.selectAll("whiskerCaps")
        .data([min, max])
        .enter()
        .append("line")
        .attr("x1", center - boxWidth / 4)
        .attr("x2", center + boxWidth / 4)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "black");

    // ---------- APPEND TO CONTAINER ----------
    container.innerHTML = ""; // clear previous renders
    container.appendChild(svg.node());
}
