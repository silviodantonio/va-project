import * as d3 from 'd3';
import { INTERSECTION_LIST, ACCIDENT_TYPE_LIST, REGION_LIST } from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection, extractIDs } from "./selectionStore.js";

export default async function main() {
    const container = {
        intersection: document.getElementById('chart-intersection'),
        accidentType: document.getElementById('chart-accident-type'),
        region: document.getElementById('chart-region')
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
    const margin = { top: 30, right: 15, bottom: 50, left: 50 };
    const width = container.intersection.clientWidth - margin.left - margin.right;
    const height = container.intersection.clientHeight - margin.top - margin.bottom;
    // Size for region bar chart
    const regionMargin = { top: 30, right: 20, bottom: 25, left: 30 };
    const regionWidth = container.region.clientWidth - regionMargin.left - regionMargin.right;
    const regionHeight = container.region.clientHeight - regionMargin.top - regionMargin.bottom;

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
        .text('Incidenti per tratto stradale');


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
        .text('Incidenti per tipo');



    const svgRegion = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${regionWidth} ${regionHeight}`)
        .attr("width", "100%")
        .attr("height", "100%");

    svgRegion.append('text')
        .attr('x', (regionWidth ) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Incidenti per regione');

    

    svgIntersection.on('click', () => updateSelection('intersection', null));
    svgAccidentType.on('click', () => updateSelection('accident_type', null));
    svgRegion.on('click', () => updateSelection('region', null));
    

    // ---------- SCALES ----------
    const xIntersection = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yIntersection = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const xAccidentType = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yAccidentType = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const xRegion = d3.scaleLinear().range([regionMargin.left + 60, regionWidth - regionMargin.right]);
    const yRegion = d3.scaleBand().range([regionMargin.top, regionHeight - regionMargin.bottom]).padding(0.2);

    // ---------- AXES ----------

    // Format numbers with SI suffixes (10k, 1M, etc.)

    const xAxisIntersection = svgIntersection.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisIntersection = svgIntersection.append('g').attr('transform', `translate(${margin.left},0)`);

    const xAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(${margin.left},0)`);

    const xAxisRegion = svgRegion.append('g').attr('transform', `translate(0,${regionHeight - regionMargin.bottom})`);
    const yAxisRegion = svgRegion.append('g').attr('transform', `translate(${regionMargin.left+60},0)`);

    // ---------- SUM DATA ----------
    function summedByDimension(data, accessor) {
        const grouped = d3.group(data, accessor);
        return Array.from(grouped, ([key, rows]) => ({
            key,
            value: d3.sum(rows, d => d.observation)
        }));
    }

    // ---------- DRAW BARS ----------
    function drawBars({ svg, data, x, y, accessor, filterKey, horizontal }) {
        const activeSelection = computeActiveSelection(selectionStore);

        // --- Background bars (full data) ---
        const bg = svg.selectAll('.bar-bg')
            .data(data, d => d.key);

        if (horizontal) {
            bg.enter().append('rect').attr('class', 'bar-bg').merge(bg)
                .attr('x', x(0))
                .attr('y', d => y(d.key))
                .attr('width', d => x(d.value) - x(0))
                .attr('height', y.bandwidth())
                .attr('fill', 'lightblue');
        } else {
            bg.enter().append('rect').attr('class', 'bar-bg').merge(bg)
                .attr('x', d => x(d.key))
                .attr('y', d => y(d.value))
                .attr('width', x.bandwidth())
                .attr('height', d => y(0) - y(d.value))
                .attr('fill', 'lightblue');
        }

        bg.exit().remove();

        // --- Foreground bars (selected data) ---
        const fgData = data.map(d => {
            const ids = rawData.filter(r => accessor(r) === d.key).map(r => r.id);
            const selectedValue = ids.reduce((sum, id) => activeSelection?.has(id) ? sum + rawData[id].observation : sum, 0);
            return { key: d.key, value: selectedValue };
        });

        const fg = svg.selectAll('.bar-fg')
            .data(fgData, d => d.key);

        if (horizontal) {
            fg.enter().append('rect').attr('class', 'bar-fg').merge(fg)
            .transition().duration(300)
            .attr('x', x(0))
            .attr('y', d => y(d.key))
            .attr('width', d => x(d.value) - x(0))
            .attr('height', y.bandwidth())
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
        } else {
            fg.enter().append('rect').attr('class', 'bar-fg').merge(fg)
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
        }

        fg.exit().remove();

        // --- Interaction layer ---
        const interaction = svg.selectAll('.bar-interaction')
            .data(data, d => d.key);

        if (horizontal) {
            interaction.enter().append('rect').attr('class', 'bar-interaction').merge(interaction)
                .attr('x', margin.left)
                .attr('y', d => y(d.key))
                .attr('width', width - margin.left - margin.right)
                .attr('height', y.bandwidth())
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
        } else {
            interaction.enter().append('rect').attr('class', 'bar-interaction').merge(interaction)
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
        }

        interaction.exit().remove();
    }

//--------------DRAW LABEL---------------------------------
function drawValueLabels({ svg, data, x, y, horizontal }) {
    const formatK = d3.format(".2~s");

    const labels = svg.selectAll('.bar-label')
        .data(data, d => d.key);

    labels.enter()
        .append('text')
        .attr('class', 'bar-label')
        .merge(labels)
        .text(d => d.value > 0 ? formatK(d.value) : '')
        .transition()
        .duration(300)
        .attr('text-anchor', horizontal ? 'start' : 'middle')
        .attr('font-size', horizontal ? '10px' : '12px')
        .attr('x', d => {
            if (horizontal) {
                return x(d.value) + 3; // to the right of the bar
            }
            return x(d.key) + x.bandwidth() / 2;
        })
        .attr('y', d => {
            if (horizontal) {
                return y(d.key) + y.bandwidth() / 2 + 4;
            }
            const barHeight = y(0) - y(d.value);
            return barHeight > 50
                ? y(d.value) + 14
                : y(d.value) - 12;
        })
        .attr('fill', '#333');

    labels.exit().remove();
    svg.selectAll('.bar-label').raise();
}

    // ---------- MAKE CHART ----------
    function makeChart({ svg, accessor, filterKey, x, y, xAxis, yAxis, horizontal }) {
        return function update() {
            const data = summedByDimension(rawData, accessor).sort((a,b)=>d3.descending(a.value,b.value));
            const formatK = d3.format(".2~s");

            if (horizontal) {
                y.domain(data.map(d => d.key));
                x.domain([0, d3.max(data, d => d.value)]);
                xAxis.call(d3.axisBottom(x).ticks(5).tickFormat(formatK));
                yAxis.call(d3.axisLeft(y));
            } else {
                x.domain(data.map(d => d.key));
                y.domain([0, d3.max(data, d => d.value)]);
                xAxis.call(d3.axisBottom(x))
                    .selectAll('text')
                    .attr('transform', 'rotate(-35)')
                    .attr('text-anchor', 'end');
                yAxis.call(d3.axisLeft(y).tickFormat(formatK));
            }

            drawBars({ svg, data, x, y, accessor, filterKey, horizontal });
            const active = computeActiveSelection(selectionStore);

            const labelData = active
                ? data.map(d => {
                    const ids = rawData
                        .filter(r => accessor(r) === d.key)
                        .map(r => r.id);

                    const value = ids.reduce(
                        (sum, id) => active.has(id) ? sum + rawData[id].observation : sum,
                        0
                    );

                    return { key: d.key, value };
                })
                : data;

            drawValueLabels({ svg, data: labelData, x, y,horizontal });
        }
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
            yAxis: yAxisIntersection,
            horizontal: false
        }),
        makeChart({
            svg: svgAccidentType,
            accessor: d => d.accident_type,
            filterKey: 'accident_type',
            x: xAccidentType,
            y: yAccidentType,
            xAxis: xAxisAccidentType,
            yAxis: yAxisAccidentType,
            horizontal: false
        }),
        makeChart({
            svg: svgRegion,
            accessor: d => d.region,
            filterKey: 'region',
            x: xRegion,
            y: yRegion,
            xAxis: xAxisRegion,
            yAxis: yAxisRegion,
            horizontal: true
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
