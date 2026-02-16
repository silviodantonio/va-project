import * as d3 from 'd3';
import { INTERSECTION_LIST, ACCIDENT_TYPE_LIST, REGION_LIST, DEADLY_LIST } from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection, extractIDs } from "./selectionStore.js";

export default async function main() {

    const margin = { top: 25, right: 45, bottom: 35, left: 45 };
    const container = document.getElementById("boxplot");
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    const center = width / 2;
    const boxWidth = 100;

    // ---------- LOAD DATA ----------
    const rawData = await d3.csv(
        "http://127.0.0.1:7000/accidents_total_with_deaths.csv",
        (d, i) => ({
            id: i,
            deadly: +d.deadly,
            deaths: Math.round(+d.deaths)
        })
    );

    // ---------- COMPUTE STATISTICS ----------
    const data_sorted = rawData
        .filter(d => d.deadly == 1)
        .map(d => d.deaths)
        .sort(d3.ascending);

    const q1 = d3.quantile(data_sorted, 0.25);
    const median = d3.quantile(data_sorted, 0.5);
    const q3 = d3.quantile(data_sorted, 0.75);
    const iqr = q3 - q1;

    const min = q1 - 1.5 * iqr;
    const max = q3 + 1.5 * iqr;

    const outliers = data_sorted.filter(d => d < min || d > max);

    // ---------- CREATE SVG ----------
    const svg = d3.create("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // ---------- Y SCALE ----------
    const dataMin = d3.min(data_sorted);
    const dataMax = d3.max(data_sorted);

    const y = d3.scaleLinear()
        .domain([0, dataMax])
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
        .attr("x", center - boxWidth / 4)
        .attr("width", boxWidth / 2)
        .attr("y", y(q3))
        .attr("height", y(q1) - y(q3))
        .attr("stroke", "black")
        .attr("fill", "steelblue");

    // ---------- MEDIAN LINE ----------
    g.append("line")
        .attr("x1", center - boxWidth / 4)
        .attr("x2", center + boxWidth / 4)
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("stroke", "grey");

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

    // ---------- OUTLIERS ----------
    g.selectAll("outliers")
        .data(outliers)
        .enter()
        .append("circle")
        .attr("cx", center)
        .attr("cy", d => y(d))
        .attr("r", 4)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("fill", "white")
        .attr("opacity", 1);


    // ---------- APPEND TO CONTAINER ----------
    container.innerHTML = ""; // clear previous renders
    container.appendChild(svg.node());
}
