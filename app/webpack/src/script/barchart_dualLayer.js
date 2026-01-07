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

    // ---------- SUM DATA ----------
    function summedByDimension(data, accessor) {
        const grouped = d3.group(data, accessor);
        return Array.from(grouped, ([key, rows]) => ({
            key,
            value: d3.sum(rows, d => d.observation)
        }));
    }

    // ---------- DRAW BARS ----------
    function drawBars({ svg, data, x, y, accessor, filterKey }) {
        const activeSelection = computeActiveSelection(selectionStore);

        // --- Background bars (full data) ---
        const bg = svg.selectAll('.bar-bg')
            .data(data, d => d.key);

        bg.enter()
            .append('rect')
            .attr('class', 'bar-bg')
            .merge(bg)
            .attr('x', d => x(d.key))
            .attr('y', d => y(d.value))
            .attr('width', x.bandwidth())
            .attr('height', d => y(0) - y(d.value))
            .attr('fill', 'lightblue');

        bg.exit().remove();

        // --- Foreground bars (selected data) ---
        const fgData = data.map(d => {
            const ids = rawData.filter(r => accessor(r) === d.key).map(r => r.id);
            const selectedValue = ids.reduce((sum, id) => activeSelection?.has(id) ? sum + rawData[id].observation : sum, 0);
            return { key: d.key, value: selectedValue };
        });

        const fg = svg.selectAll('.bar-fg')
            .data(fgData, d => d.key);

        fg.enter()
            .append('rect')
            .attr('class', 'bar-fg')
            .merge(fg)
            .transition().duration(300)
            .attr('x', d => x(d.key))
            .attr('y', d => y(d.value))
            .attr('width', x.bandwidth())
            .attr('height', d => y(0) - y(d.value))
            .attr('fill', 'steelblue');

        fg.exit().remove();

        // --- Interaction layer ---
        const interaction = svg.selectAll('.bar-interaction')
            .data(data, d => d.key);

        interaction.enter()
            .append('rect')
            .attr('class', 'bar-interaction')
            .merge(interaction)
            .attr('x', d => x(d.key))
            .attr('y', 0)
            .attr('width', x.bandwidth())
            .attr('height', height)
            .style('fill', 'transparent')
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();

                if (selectionStore.pca != null) {
                    document.dispatchEvent(new CustomEvent("clear-pca-brush"));
                }
                
                const ids = new Set(rawData.filter(r => accessor(r) === d.key).map(r => r.id));
                const current = selectionStore[filterKey];
                const same = current && current.size === ids.size && [...ids].every(id => current.has(id));
                updateSelection(filterKey, same ? null : ids);
            });

        interaction.exit().remove();
    }

    // ---------- MAKE CHART ----------
    function makeChart({ svg, accessor, filterKey, x, y, xAxis, yAxis }) {
        return function update() {
            const data = summedByDimension(rawData, accessor);

            x.domain(data.map(d => d.key));
            y.domain([0, d3.max(data, d => d.value)]); // Fixed axes

            xAxis.call(d3.axisBottom(x))
                 .selectAll('text')
                 .attr('transform', 'rotate(-45)')
                 .attr('text-anchor', 'end');

            yAxis.call(d3.axisLeft(y));

            drawBars({ svg, data, x, y, accessor, filterKey });
        };
    }

    // ---------- CHARTS ----------
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

    function updateAll() { charts.forEach(c => c()); }

    document.addEventListener('selection-changed', updateAll);

    // ---------- INITIAL RENDER ----------
    updateAll();
    container.intersection.append(svgIntersection.node());
    container.accidentType.append(svgAccidentType.node());
}
