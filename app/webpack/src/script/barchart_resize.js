import * as d3 from 'd3';
import { INTERSECTION_LIST, ACCIDENT_TYPE_LIST } from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection } from "./selectionStore.js";

export default async function main() {
    const container = {
        intersection: document.getElementById('chart-intersection'),
        accidentType: document.getElementById('chart-accident-type')
    };

    // ---------- LOAD DATA ----------
    const rawData = await d3.csv(
        "http://127.0.0.1:7000/accidents_regions_complete.csv",
        (d, i) => ({
            id: i,
            intersection: INTERSECTION_LIST[+d.intersection - 1],
            accident_type: ACCIDENT_TYPE_LIST[+d.accident_type - 1],
            observation: +d.observation
        })
    );

    // ---------- DIMENSIONS ----------
    const width = 350;
    const height = 350;
    const margin = { top: 20, right: 15, bottom: 70, left: 50 };

    // ---------- SVGs ----------
    const svgIntersection = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`);

    const svgAccidentType = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`);

    // ---------- SCALES ----------
    const xIntersection = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yIntersection = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const xAccidentType = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yAccidentType = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    // ---------- AXES ----------
    const xAxisIntersection = svgIntersection.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisIntersection = svgIntersection.append('g').attr('transform', `translate(${margin.left},0)`);

    const xAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(${margin.left},0)`);

    // ---------- DATA SUMMING BASED ON SELECTION ----------
    function summedByDimension(data, accessor) {
        const activeSelection = computeActiveSelection(selectionStore);
        const grouped = d3.group(data, accessor);

        return Array.from(grouped, ([key, rows]) => ({
            key,
            // Only include observations if they are in the current active selection
            value: d3.sum(rows, d => (!activeSelection || activeSelection.has(d.id)) ? d.observation : 0)
        }));
    }

    // ---------- DRAW BARS ----------
    function drawBars({ svg, data, x, y, accessor, filterKey }) {
        const groups = svg.selectAll('.bar-group').data(data, d => d.key);

        const gEnter = groups.enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('transform', d => `translate(${x(d.key)},0)`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                const ids = new Set(rawData.filter(r => accessor(r) === d.key).map(r => r.id));
                const current = selectionStore[filterKey];
                const same = current && current.size === ids.size && [...ids].every(id => current.has(id));
                updateSelection(filterKey, same ? null : ids);
            });

        groups.merge(gEnter)
            .attr('transform', d => `translate(${x(d.key)},0)`)
            .selectAll('rect')
            .data(d => [d])
            .join('rect')
            .transition().duration(300) // smooth resize
            .attr('x', 0)
            .attr('width', x.bandwidth())
            .attr('y', d => y(d.value))
            .attr('height', d => y(0) - y(d.value))
            .attr('fill', 'steelblue');

        groups.exit().remove();
    }

    // ---------- CREATE CHART FUNCTION ----------
    function makeChart({ svg, accessor, filterKey, x, y, xAxis, yAxis, sort }) {
        return function update() {
            let data = summedByDimension(rawData, accessor);
            if (sort) data.sort(sort);

            x.domain(data.map(d => d.key));
            y.domain([0, d3.max(data, d => d.value)]);

            xAxis.call(d3.axisBottom(x))
                 .selectAll('text')
                 .attr('transform', 'rotate(-45)')
                 .attr('text-anchor', 'end');

            yAxis.call(d3.axisLeft(y));

            drawBars({ svg, data, x, y, accessor, filterKey });
        };
    }

    // ---------- CREATE CHARTS ----------
    const charts = [
        makeChart({
            svg: svgIntersection,
            accessor: d => d.intersection,
            filterKey: 'intersection',
            x: xIntersection,
            y: yIntersection,
            xAxis: xAxisIntersection,
            yAxis: yAxisIntersection
        }),
        makeChart({
            svg: svgAccidentType,
            accessor: d => d.accident_type,
            filterKey: 'accident_type',
            x: xAccidentType,
            y: yAccidentType,
            xAxis: xAxisAccidentType,
            yAxis: yAxisAccidentType
        })
    ];

    function updateAll() {
        charts.forEach(c => c());
    }

    // Listen to selection changes globally
    document.addEventListener('selection-changed', updateAll);

    // ---------- INITIAL RENDER ----------
    updateAll();
    container.intersection.append(svgIntersection.node());
    container.accidentType.append(svgAccidentType.node());
}
