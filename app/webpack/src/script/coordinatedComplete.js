import * as d3 from 'd3';

export default async function main () {
    const container = document.getElementById('bar-container');

    const region_list = ["Piemonte", "Valle d'Aosta / Vallée d'Aoste", "Liguria", "Lombardia", "Trentino Alto Adige / Südtirol", "Veneto", "Friuli-Venezia Giulia", "Emilia-Romagna", "Toscana", "Umbria", "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"];

    const month_list = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]

    const intersection_list = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]

    // ---------- LOAD & PREPARE RAW DATA ----------
    const rawData = await d3.csv(
        "http://127.0.0.1:7000/accidents_region.csv",
        d => ({
            //region: region_list[+d.region - 1],
            //intersection: d.road_section_desc,
            //accident_type: d.accident_type_desc,
            //deadly: d.deadly,
            //vehicle_type: d.vehicle_type_desc,
            //month: month_list[+d.month - 1],
            //observations: +d.observations
        })
    );

    // ---------- SHARED FILTER STATE ----------
    const filters = {
        area: null,
        month: null,
        road_type: null,
        road_section: null,
        accident_type: null,
        vehicle_type: null
    };

    const distanceColors = [
        'steelblue',
        '#8ecae6',
        '#adb5bd',
        '#6c757d',
        '#495057',
        '#212529',
        '#000000'
    ];

    // ---------- DIMENSIONS ----------
    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 110;
    const marginLeft = 60;

    // ---------- SVGs ----------
    const svgRegion = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    const svgMonth = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    const svgRoadType = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    const svgRoadSection = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    const svgAccidentType = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    const svgVehicleType = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    // ---------- SCALES ----------
    const xRegion = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yRegion = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    const xMonth = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yMonth = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    const xRoadType = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yRoadType = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    const xRoadSection = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yRoadSection = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    const xAccidentType = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yAccidentType = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    const xVehicleType = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yVehicleType = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    // ---------- AXES ----------
    const xAxisRegion = svgRegion.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisRegion = svgRegion.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    const xAxisMonth = svgMonth.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisMonth = svgMonth.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    const xAxisRoadType = svgRoadType.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisRoadType = svgRoadType.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    const xAxisRoadSection = svgRoadSection.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisRoadSection = svgRoadSection.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    const xAxisAccidentType = svgAccidentType.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisAccidentType = svgAccidentType.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    const xAxisVehicleType = svgVehicleType.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisVehicleType = svgVehicleType.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    // ---------- CORE LOGIC ----------
    function filterDistance(d) {
        let dist = 0;
        if (filters.area && d.area !== filters.area) dist++;
        if (filters.month && d.month !== filters.month) dist++;
        if (filters.road_type && d.road_type !== filters.road_type) dist++;
        if (filters.road_section && d.road_section !== filters.road_section) dist++;
        if (filters.accident_type && d.accident_type !== filters.accident_type) dist++;
        if (filters.vehicle_type && d.vehicle_type !== filters.vehicle_type) dist++;
        return dist;
    }

    function colorForDistance(d) {
        return distanceColors[Math.min(d, distanceColors.length - 1)];
    }

    function stackedByDimension(data, accessor) {
        const grouped = d3.group(data, accessor);

        return Array.from(grouped, ([key, rows]) => {
            const stacks = d3.rollup(
                rows,
                v => d3.sum(v, d => d.observations),
                d => filterDistance(d)
            );

            return {
                key,
                stacks: Array.from(stacks, ([distance, value]) => ({
                    distance,
                    value
                })).sort((a, b) => d3.ascending(a.distance, b.distance))
            };
        });
    }

    function drawMultiStackedBars(svg, data, x, y, onClick) {
        const groups = svg.selectAll('.bar-group')
            .data(data, d => d.key);

        const gEnter = groups.enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('transform', d => `translate(${x(d.key)},0)`)
            .style('cursor', 'pointer')
            .on('click', (e, d) => onClick(d.key));

        groups.merge(gEnter).each(function(d) {
            let offset = 0;
            const g = d3.select(this);

            const rects = g.selectAll('rect')
                .data(d.stacks, s => s.distance);

            rects.enter()
                .append('rect')
                .merge(rects)
                .attr('x', 0)
                .attr('width', x.bandwidth())
                .attr('y', s => {
                    const y0 = y(offset + s.value);
                    offset += s.value;
                    return y0;
                })
                .attr('height', s => y(0) - y(s.value))
                .attr('fill', s => colorForDistance(s.distance));

            rects.exit().remove();
        });

        groups.exit().remove();
    }

    function makeChart({ svg, accessor, filterKey, x, y, xAxis, yAxis, sort }) {
        return function update() {
            let data = stackedByDimension(rawData, accessor);
            if (sort) data.sort(sort);

            x.domain(data.map(d => d.key));
            y.domain([0, d3.max(data, d => d3.sum(d.stacks, s => s.value))]);

            xAxis.call(d3.axisBottom(x))
                .selectAll('text')
                .attr('transform', 'rotate(-45)')
                .attr('text-anchor', 'end');

            yAxis.call(d3.axisLeft(y));

            drawMultiStackedBars(svg, data, x, y, key => {
                filters[filterKey] = filters[filterKey] === key ? null : key;
                updateAll();
            });
        };
    }

    const charts = [
        makeChart({
            svg: svgRegion,
            accessor: d => d.area,
            filterKey: 'area',
            x: xRegion,
            y: yRegion,
            xAxis: xAxisRegion,
            yAxis: yAxisRegion,
            sort: (a, b) =>
                d3.descending(
                    d3.sum(a.stacks, s => s.value),
                    d3.sum(b.stacks, s => s.value)
                )
        }),
        makeChart({
            svg: svgMonth,
            accessor: d => d.month,
            filterKey: 'month',
            x: xMonth,
            y: yMonth,
            xAxis: xAxisMonth,
            yAxis: yAxisMonth
        }),
        makeChart({
            svg: svgRoadType,
            accessor: d => d.road_type,
            filterKey: 'road_type',
            x: xRoadType,
            y: yRoadType,
            xAxis: xAxisRoadType,
            yAxis: yAxisRoadType
        }),
        makeChart({
            svg: svgRoadSection,
            accessor: d => d.road_section,
            filterKey: 'road_section',
            x: xRoadSection,
            y: yRoadSection,
            xAxis: xAxisRoadSection,
            yAxis: yAxisRoadSection
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
            svg: svgVehicleType,
            accessor: d => d.vehicle_type,
            filterKey: 'vehicle_type',
            x: xVehicleType,
            y: yVehicleType,
            xAxis: xAxisVehicleType,
            yAxis: yAxisVehicleType
        })
    ];

    function updateAll() {
        charts.forEach(c => c());
    }

    // ---------- INITIAL RENDER ----------
    updateAll();
    container.append(svgRegion.node());
    container.append(svgMonth.node());
    container.append(svgRoadType.node());
    container.append(svgRoadSection.node());
    container.append(svgAccidentType.node());
    container.append(svgVehicleType.node());
}
