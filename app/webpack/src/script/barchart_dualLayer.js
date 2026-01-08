import * as d3 from 'd3';
import { INTERSECTION_LIST, ACCIDENT_TYPE_LIST, REGION_LIST } from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection, extractIDs } from "./selectionStore.js";

export default async function main() {
    const container = {
        intersection: document.getElementById('chart-intersection'),
        accidentType: document.getElementById('chart-accident-type'),
        region: document.getElementById('extra-chart')
    };

    // ---------- LOAD DATA ----------
    const rawData = await d3.csv(
        "http://127.0.0.1:7000/accidents_regions_complete.csv",
        (d, i) => ({
            id: i,
            intersection: INTERSECTION_LIST[+d.intersection - 1],
            accident_type: ACCIDENT_TYPE_LIST[+d.accident_type - 1],
            region: REGION_LIST[+d.region - 1],
            observation: +d.observation
        })
    );

    // ---------- DIMENSIONS ----------
    // const width = 350;
    // const height = 380;
    const margin = { top: 20, right: 15, bottom: 70, left: 50 };
    const width = container.intersection.clientWidth - margin.left - margin.right;
    const height = container.intersection.clientHeight - margin.top - margin.bottom;

    // ---------- SVGs ----------
    const svgIntersection = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    svgIntersection.append('text')
        .attr('x', (width + margin.left + margin.right) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Accidents by Intersection Type');


    const svgAccidentType = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");
    
    svgAccidentType.append('text')
        .attr('x', (width + margin.left + margin.right) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Accidents by Type');



    const svgRegion = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    svgRegion.append('text')
        .attr('x', (width + margin.left + margin.right) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Accidents by Region');

    

    svgIntersection.on('click', () => updateSelection('intersection', null));
    svgAccidentType.on('click', () => updateSelection('accident_type', null));
    svgRegion.on('click', () => updateSelection('region', null));
    

    // ---------- SCALES ----------
    const xIntersection = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yIntersection = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const xAccidentType = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yAccidentType = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const xRegion = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yRegion = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    // ---------- AXES ----------
    const xAxisIntersection = svgIntersection.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisIntersection = svgIntersection.append('g').attr('transform', `translate(${margin.left},0)`);

    const xAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(${margin.left},0)`);

    const xAxisRegion = svgRegion.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisRegion = svgRegion.append('g').attr('transform', `translate(${margin.left},0)`);

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
            .attr('fill', 'steelblue')
            .attr('stroke', d => {
                const localSelection = extractIDs(selectionStore[filterKey]);
                if (!localSelection) return 'none';

                const ids = rawData
                    .filter(r => accessor(r) === d.key)
                    .map(r => r.id);

                return ids.some(id => localSelection.has(id)) ? '#222' : 'none';
            })
            .attr('stroke-width', d => {
                const localSelection = extractIDs(selectionStore[filterKey]);
                if (!localSelection) return 0;

                const ids = rawData
                    .filter(r => accessor(r) === d.key)
                    .map(r => r.id);

                return ids.some(id => localSelection.has(id)) ? 2 : 0;
            });

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
        }),
        makeChart({
            svg: svgRegion,
            accessor: d => d.region,
            filterKey: 'region',
            x: xRegion,
            y: yRegion,
            xAxis: xAxisRegion,
            yAxis: yAxisRegion
        })
    ];

    function updateAll() { charts.forEach(c => c()); }

    document.addEventListener('selection-changed', updateAll);

    // ---------- INITIAL RENDER ----------
    updateAll();
    container.intersection.append(svgIntersection.node());
    container.accidentType.append(svgAccidentType.node());
    container.region.append(svgRegion.node());
}
