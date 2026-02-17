import * as d3 from 'd3';
import { INTERSECTION_LIST, ACCIDENT_TYPE_LIST, REGION_LIST, DEADLY_LIST } from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection, extractIDs } from "./selectionStore.js";
import { drawTrendLegends } from './legendUtils.js';



export default async function main() {
    const container = {
        intersection: document.getElementById('chart-intersection'),
        accidentType: document.getElementById('chart-accident-type'),
        deadly: document.getElementById('chart-deadly'),
        region: document.getElementById('chart-region')
    };

    // ---------- LOAD DATA ----------
    const rawData = await d3.csv(
        "http://127.0.0.1:7000/accidents_regions_complete.csv",
        (d, i) => ({
            id: i,
            intersection: INTERSECTION_LIST[+d.intersection - 1],
            accident_type: ACCIDENT_TYPE_LIST[+d.accident_type - 1],
            deadly: DEADLY_LIST[+d.deadly],
            region: REGION_LIST[+d.region - 1],
            observation: +d.observation
        })
    );

    const totalObservations = d3.sum(rawData, d => d.observation);

    // ---------- DIMENSIONS ----------
    // const width = 350;
    // const height = 380;
    // Size for intersection bar chart
    const margin = { top: 35, right: 25, bottom: 60, left: 40 };
    const width = container.intersection.clientWidth;
    const height = container.intersection.clientHeight;
    // Size for accident bar chart
    const accidentMargin = { top: 35, right: 25, bottom: 60, left: 40 };
    const accidentWidth = container.accidentType.clientWidth;
    const accidentHeight = container.accidentType.clientHeight;
    // Size for deadly bar chart
    const deadlyMargin = { top: 35, right: 45, bottom: 60, left: 50 };
    const deadlyWidth = container.deadly.clientWidth;
    const deadlyHeight = container.deadly.clientHeight;
    // Size for region bar chart
    const regionMargin = { top: 30, right: 30, bottom: 30, left: 90 };
    const regionWidth = container.region.clientWidth;
    const regionHeight = container.region.clientHeight;

    // ---------- SVGs ----------
    const svgIntersection = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    svgIntersection.append('text')
        .attr('x', (width) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Incidenti per tratto stradale');


    const svgAccidentType = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${accidentWidth} ${accidentHeight}`)
        .attr("width", "100%")
        .attr("height", "100%");
    
    svgAccidentType.append('text')
        .attr('x', (accidentWidth) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Incidenti per tipo');


    const svgDeadly = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${deadlyWidth} ${deadlyHeight}`)
        .attr("width", "100%")
        .attr("height", "100%");
    
    svgDeadly.append('text')
        .attr('x', (deadlyWidth) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Mortalità');

    const svgRegion = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${regionWidth} ${regionHeight}`)
        .attr("width", "100%")
        .attr("height", "100%");

    svgRegion.append('text')
        .attr('x', (regionWidth) / 2)
        .attr('y', 20) // Position within the top margin
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text('Incidenti per regione');

    

    svgIntersection.on('click', () => updateSelection('intersection', null));
    svgAccidentType.on('click', () => updateSelection('accident_type', null));
    svgDeadly.on('click', () => updateSelection('deadly', null));
    svgRegion.on('click', () => updateSelection('region', null));
    

    // ---------- SCALES ----------
    const xIntersection = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.2);
    const yIntersection = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const xAccidentType = d3.scaleBand().range([accidentMargin.left, accidentWidth - accidentMargin.right]).padding(0.2);
    const yAccidentType = d3.scaleLinear().range([accidentHeight - accidentMargin.bottom, accidentMargin.top]);

    const xDeadly = d3.scaleBand().range([deadlyMargin.left, deadlyWidth - deadlyMargin.right]).padding(0.2);
    const yDeadly = d3.scaleLinear().range([deadlyHeight - deadlyMargin.bottom, deadlyMargin.top]);

    const xRegion = d3.scaleLinear().range([regionMargin.left, regionWidth - regionMargin.right]);
    const yRegion = d3.scaleBand().range([regionMargin.top, regionHeight - regionMargin.bottom]).padding(0.2);

    // ---------- AXES ----------

    // Format numbers with SI suffixes (10k, 1M, etc.)

    const xAxisIntersection = svgIntersection.append('g').attr('transform', `translate(0,${height - margin.bottom})`);
    const yAxisIntersection = svgIntersection.append('g').attr('transform', `translate(${margin.left},0)`);

    const xAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(0,${accidentHeight - accidentMargin.bottom})`);
    const yAxisAccidentType = svgAccidentType.append('g').attr('transform', `translate(${accidentMargin.left},0)`);

    const xAxisDeadly = svgDeadly.append('g').attr('transform', `translate(0,${deadlyHeight - deadlyMargin.bottom})`);
    const yAxisDeadly = svgDeadly.append('g').attr('transform', `translate(${deadlyMargin.left},0)`);

    const xAxisRegion = svgRegion.append('g').attr('transform', `translate(0,${regionHeight - regionMargin.bottom})`);
    const yAxisRegion = svgRegion.append('g').attr('transform', `translate(${regionMargin.left},0)`);

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
        const MIN_BAR_PX = 2.5;

        const activeSelection = computeActiveSelection(selectionStore);

        // --- Background bars (full data) ---
        const bg = svg.selectAll('.bar-bg')
            .data(data, d => d.key);

        if (horizontal) {
            bg.enter().append('rect').attr('class', 'bar-bg').merge(bg)
                .attr('x', x(0))
                .attr('y', d => y(d.key))
                .attr('width', d => {
                    const w = x(d.value) - x(0);
                    return d.value > 0 ? Math.max(w, MIN_BAR_PX) : 0;
                })
                .attr('height', y.bandwidth())
                .attr('fill', 'lightblue');
        } else {
            bg.enter().append('rect').attr('class', 'bar-bg').merge(bg)
                .attr('x', d => x(d.key))
                .attr('y', d => {
                    const h = y(0) - y(d.value);
                    return d.value > 0
                        ? y(0) - Math.max(h, MIN_BAR_PX)
                        : y(0);
                })
                .attr('width', x.bandwidth())
                .attr('height', d => {
                    const h = y(0) - y(d.value);
                    return d.value > 0 ? Math.max(h, MIN_BAR_PX) : 0;
                })
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
            .attr('width', d => {
                        const w = x(d.value) - x(0);
                        return d.value > 0 ? Math.max(w, MIN_BAR_PX) : 0;
            })
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
            .attr('y', d => {
                const h = y(0) - y(d.value);
                return d.value > 0
                    ? y(0) - Math.max(h, MIN_BAR_PX)
                    : y(0);
            })
            .attr('width', x.bandwidth())
            .attr('height', d => {
                const h = y(0) - y(d.value);
                return d.value > 0 ? Math.max(h, MIN_BAR_PX) : 0;
            })
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

    /*--------------DRAW VALUE LABEL-------------*/

function drawValueLabels({ svg, data, x, y, horizontal, active }) {
    const formatK = d3.format(".2~s");
    const formatPercent = d3.format(".1%");

    const barHeightTreshold = 60;
    const barLengthTreshold = 80;

    // if a trend is outsite +/- trendTolerance % it is marked as
    // increasing or decreasing
    const trendTolerance = 0.5

    // --- Value label ---
    const labels = svg.selectAll('.bar-label')
        .data(data, d => d.key);

    labels.enter()
        .append('text')
        .attr('class', 'bar-label')
        .merge(labels)
        .text(d => {
            const valueText = d.value > 0 ? formatK(d.value) : '0';
            if (horizontal && active && active.size > 0) {
                return valueText;
            }
            return valueText;
        })
        .transition()
        .duration(300)
        .attr('text-anchor', horizontal ? 'start' : 'middle')
        .attr('font-size', horizontal ? '10px' : '14px')
        .attr('x', d => {
                const barLen = x(d.value) - x(0);
                if (horizontal) {
                    return barLen > barLengthTreshold ? x(d.value) - 23 : x(d.value) + 4
                }
                else {
                    return x(d.key) + x.bandwidth() / 2  
                }
            })
        .attr('y', d => {
            if (horizontal) {
                return y(d.key) + y.bandwidth() / 2 + 3;
            }
            const barHeight = y(0) - y(d.value);
            return barHeight > barHeightTreshold ? y(d.value) + 23 : y(d.value) - 8;
        })
        .attr('fill', '#333');

    labels.exit().remove();

    // --- Percentage label (horizontal + vertical) ---
    if (active && active.size > 0) {
        const percentLabels = svg.selectAll('.bar-percent')
            .data(data, d => d.key);

        percentLabels.enter()
            .append('text')
            .attr('class', 'bar-percent')
            .merge(percentLabels)
            .text(d => `${formatPercent(d.percentage)}`||0)
            .transition()
            .duration(300)
            .attr('text-anchor', horizontal ? 'start' : 'middle')
            .attr('font-size', horizontal ? '10px' : '12px')
            .attr('x', d =>
                horizontal
                    ? x(d.value) + 25
                    : x(d.key) + x.bandwidth() / 2
            )
            .attr('x', d => {
                const barLen = x(d.value) - x(0);
                if (horizontal) {
                    return barLen > barLengthTreshold ? x(d.value) - 78 : x(d.value) + 28
                }
                else {
                    return x(d.key) + x.bandwidth() / 2  
                }
            })
            .attr('y', d => {
                if (horizontal) {
                    return y(d.key) + y.bandwidth() / 2 + 3;
                }
                const barHeight = y(0) - y(d.value);
                return barHeight > barHeightTreshold ? y(d.value) + 56 : y(d.value) - 25;
            })
        .attr('fill', d => {
            const barLen = x(d.value) - x(0);
            const barHeight = y(0) - y(d.value);
            if (horizontal) {
                    return barLen > barLengthTreshold ? 'white': 'blue'
                }
                else {
                    return barHeight > barHeightTreshold ? 'white': 'blue'
                }
        });

        percentLabels.exit().remove();

        const trendLabels = svg.selectAll('.bar-trend')
            .data(data, d => d.key);

        for (const d of data) {
            let categoryPercentage = Math.round(d.total / totalObservations * 100)
            let selectionPercentage = Math.round(d.value / d.totalSelection * 100)
            d.trend = categoryPercentage - selectionPercentage
        }

        // Trend labels
        trendLabels.enter()
            .append('text')
            .attr('class', 'bar-trend')
            .merge(trendLabels)
            .text(d => {
                if (d.trend > trendTolerance) {
                    return '\u25BC' // triangle pointed down
                }
                else if (d.trend < -trendTolerance) {
                    return '\u25B2' // triangle pointed up
                }
                else {
                    return '\u223C' // same as ~ but prettier
                }
            }) 
            .transition()
            .duration(300)
            .attr('text-anchor', horizontal ? 'start' : 'middle')
            .attr('font-size', horizontal ? '10px' : '12px')
            .attr('x', d => {
                const barLen = x(d.value) - x(0);
                if (horizontal) {
                    return barLen > barLengthTreshold ? x(d.value) - 40 : x(d.value) + 63
                }
                else {
                    return x(d.key) + x.bandwidth() / 2  
                }
            })
            .attr('y', d => {
                if (horizontal) {
                    return y(d.key) + y.bandwidth() / 2 + 3;
                }
                const barHeight = y(0) - y(d.value);
                return barHeight > barHeightTreshold ? y(d.value) + 41 : y(d.value) - 40;
            })
        .attr('fill', d => {
            if (d.trend > trendTolerance) {
                    return 'limegreen' // triangle pointed down
                }
                else if (d.trend < -trendTolerance) {
                    return 'red' // triangle pointed up
                }
                else {
                    return 'blue'
                }
        });

        trendLabels.exit().remove();

    } else {
        svg.selectAll('.bar-percent, .bar-trend').remove();
    }

    svg.selectAll('.bar-label, .bar-percent').raise();
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

          
            const active = computeActiveSelection(selectionStore);
            console.log("active", active);
            drawBars({ svg, data, x, y, accessor, filterKey, horizontal });

            /* PERCENTAULE COMPLESSIVA SUL VALORE SINGOLA BARRA */

            // Compute label data with percentages
            let labelData;

            if (active && active.size > 0) {

                // Per ogni barra del grafico
                labelData = data.map(d => {

                    const barName = d.key;
                    // All rows in this category/bar
                    const rowsForBar = rawData.filter(r => accessor(r) === d.key);
                    console.log("rows per Bar", rowsForBar);
                    // total accidents for this bar (baseline)
                    const totalPerBar = rowsForBar.reduce((sum, r) => sum + r.observation, 0);
                     console.log("totalPerBar", totalPerBar);

                    // total selected accidents in this bar
                    const selectedValue = rowsForBar.reduce(
                        (sum, r) => (active && active.has(r.id) ? sum + r.observation : sum),
                        0
                    );
                        console.log("selectedValue", selectedValue);

                    // percentage relative to this bar's total
                    const percentage = totalPerBar > 0 ? selectedValue / totalPerBar : 0;

                    let totalSelection = 0
                    for (let d of rawData){
                        if (active.has(d.id)){
                            totalSelection += d.observation;
                        }
                    }

                    return {
                        key: d.key,
                        value: selectedValue, // used for foreground bar
                        total: totalPerBar,   // baseline for background bar
                        totalSelection: totalSelection,
                        percentage            // fraction of selection over bar total
                    };
                });

                /* ================================PERCENTAULE COMPLESSIVA SUL GRAFICO =================================*/
                //  const barName = d.key;
                //     // All rows in this category/bar
                //     const rowsForBar = rawData.filter(r => accessor(r) === d.key);
                //     console.log("rows per Bar", rowsForBar);
                //     // total accidents for this bar (baseline)
                //     const totalPerBar = rowsForBar.reduce((sum, r) => sum + r.observation, 0);
                //      console.log("totalPerBar", totalPerBar);

                //     // total selected accidents in this bar
                //     const selectedValue = rowsForBar.reduce(
                //         (sum, r) => (active && active.has(r.id) ? sum + r.observation : sum),
                //         0
                //     );
                //         console.log("selectedValue", selectedValue);

                //     // percentage relative to this bar's total
                //     const percentage = totalPerBar > 0 ? selectedValue / totalPerBar : 0;

                //     return {
                //         key: d.key,
                //         value: selectedValue, // used for foreground bar
                //         total: totalPerBar,   // baseline for background bar
                //         percentage            // fraction of selection over bar total
                //     };

/*===================================================================================================================*/

            } else {
                // Nessuna selezione: percentuale = 0
                labelData = data.map(d => ({ ...d, value: d.value, percentage: 0, total: d.value }));
            }



            drawValueLabels({ svg, data: labelData, x, y, horizontal, active });
        } // close update()
    } // close makeChart()


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
            svg: svgDeadly,
            accessor: d => d.deadly,
            filterKey: 'deadly',
            x: xDeadly,
            y: yDeadly,
            xAxis: xAxisDeadly,
            yAxis: yAxisDeadly,
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
    drawTrendLegends(svgIntersection, 180, 50);
    container.intersection.append(svgIntersection.node());
    container.accidentType.append(svgAccidentType.node());
    container.deadly.append(svgDeadly.node());
    // drawTrendLegends(svgRegion, 20, 20);
    container.region.append(svgRegion.node());
}
