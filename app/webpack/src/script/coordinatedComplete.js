import * as d3 from 'd3';

export default async function main () {
    const container = {
        // region: document.getElementById('chart-region'),
        intersection: document.getElementById('chart-intersection'),
        accidentType: document.getElementById('chart-accident-type')
        // deadly: document.getElementById('chart-deadly'),
        // hour: document.getElementById('chart-hour'),
        // weekDay: document.getElementById('chart-week-day'),
        // month: document.getElementById('chart-month')
    };

    const region_list = ["Piemonte", "Valle d'Aosta / Vallée d'Aoste", "Liguria", "Lombardia", "Trentino Alto Adige / Südtirol", "Veneto", "Friuli-Venezia Giulia", "Emilia-Romagna", "Toscana", "Umbria", "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"];

    const intersection_list = ["crossroad", "traffic circle", "level crossing", "straight stretch", "bend", "bump-slope-bottleneck", "tunnel"];

    const accident_type_list = ["accident between vehicles", "vehicle-pedestrian accident", "accidents involving a single vehicle"];

    // const deadly_list = ["Injured", "Dead"];

    // const week_day_list = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // const month_list = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    // ---------- LOAD & PREPARE RAW DATA ----------
    const rawData = await d3.csv(
        "http://127.0.0.1:7000/accidents_regions_complete.csv",
        d => ({
            // region: region_list[+d.region - 1],
            intersection: intersection_list[+d.intersection - 1],
            accident_type: accident_type_list[+d.accident_type - 1],
            // deadly: deadly_list[d.deadly],
            // hour: d.hour,
            // week_day: week_day_list[+d.week_day - 1],
            // month: month_list[+d.month - 1],
            observation: +d.observation
        })
    );

    // ---------- SHARED FILTER STATE ----------
    const filters = {
        // region: null,
        intersection: null,
        accident_type: null
        // deadly: null,
        // hour: null,
        // week_day: null,
        // month: null
    };

    const distanceColors = [
        'steelblue',
        '#8ecae6',
        "#a3b8c9", // jolly color
        '#adb5bd',
        '#6c757d',
        '#495057',
        '#212529',
        '#000000'
    ];

    // ---------- DIMENSIONS ----------
    const width = 350;
    const height = 350;

    const marginTop = 20;
    const marginRight = 15;
    const marginBottom = 70;  // More space for rotated labels
    const marginLeft = 50;

    // ---------- SVGs ----------
    // const svgRegion = d3.create('svg')
    //     .attr("preserveAspectRatio", "xMinYMin meet")
    //     .attr("viewBox", "0 0 "+ width + " " + height)

    const svgIntersection = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 "+ width + " " + height)
    const svgAccidentType = d3.create('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 "+ width + " " + height)

    // const svgDeadly = d3.create('svg')
    //     .attr("preserveAspectRatio", "xMinYMin meet")
    //     .attr("viewBox", "0 0 "+ width + " " + height)
    // const svgHour = d3.create('svg')
    //     .attr("preserveAspectRatio", "xMinYMin meet")
    //     .attr("viewBox", "0 0 "+ width + " " + height)
    // const svgWeekDay = d3.create('svg')
    //     .attr("preserveAspectRatio", "xMinYMin meet")
    //     .attr("viewBox", "0 0 "+ width + " " + height)

    // const svgMonth = d3.create('svg')
    //     .attr("preserveAspectRatio", "xMinYMin meet")
    //     .attr("viewBox", "0 0 "+ width + " " + height)

    // ---------- SCALES ----------
    // const xRegion = d3.scaleBand()
    //     .range([marginLeft, width - marginRight])
    //     .padding(0.2);

    // const yRegion = d3.scaleLinear()
    //     .range([height - marginBottom, marginTop]);

    const xIntersection = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yIntersection = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    const xAccidentType = d3.scaleBand()
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const yAccidentType = d3.scaleLinear()
        .range([height - marginBottom, marginTop]);

    // const xDeadly = d3.scaleBand()
    //     .range([marginLeft, width - marginRight])
    //     .padding(0.2);

    // const yDeadly = d3.scaleLinear()
    //     .range([height - marginBottom, marginTop]);

    // const xHour = d3.scaleBand()
    //     .range([marginLeft, width - marginRight])
    //     .padding(0.2);

    // const yHour = d3.scaleLinear()
    //     .range([height - marginBottom, marginTop]);

    // const xWeekDay = d3.scaleBand()
    //     .range([marginLeft, width - marginRight])
    //     .padding(0.2);

    // const yWeekDay = d3.scaleLinear()
    //     .range([height - marginBottom, marginTop]);

    // const xMonth = d3.scaleBand()
    //     .range([marginLeft, width - marginRight])
    //     .padding(0.2);

    // const yMonth = d3.scaleLinear()
    //     .range([height - marginBottom, marginTop]);

    // ---------- AXES ----------
    // const xAxisRegion = svgRegion.append('g')
    //     .attr('transform', `translate(0,${height - marginBottom})`);

    // const yAxisRegion = svgRegion.append('g')
    //     .attr('transform', `translate(${marginLeft},0)`);

    const xAxisIntersection = svgIntersection.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisIntersection = svgIntersection.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    const xAxisAccidentType = svgAccidentType.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`);

    const yAxisAccidentType = svgAccidentType.append('g')
        .attr('transform', `translate(${marginLeft},0)`);

    // const xAxisDeadly = svgDeadly.append('g')
    //     .attr('transform', `translate(0,${height - marginBottom})`);

    // const yAxisDeadly = svgDeadly.append('g')
    //     .attr('transform', `translate(${marginLeft},0)`);

    // const xAxisHour = svgHour.append('g')
    //     .attr('transform', `translate(0,${height - marginBottom})`);

    // const yAxisHour = svgHour.append('g')
    //     .attr('transform', `translate(${marginLeft},0)`);

    // const xAxisWeekDay = svgWeekDay.append('g')
    //     .attr('transform', `translate(0,${height - marginBottom})`);

    // const yAxisWeekDay = svgWeekDay.append('g')
    //     .attr('transform', `translate(${marginLeft},0)`);

    // const xAxisMonth = svgMonth.append('g')
    //     .attr('transform', `translate(0,${height - marginBottom})`);

    // const yAxisMonth = svgMonth.append('g')
    //     .attr('transform', `translate(${marginLeft},0)`);

    // ---------- CORE LOGIC ----------
    function filterDistance(d) {
        let dist = 0;
        // if (filters.region && d.region !== filters.region) dist++;
        if (filters.intersection && d.intersection !== filters.intersection) dist++;
        if (filters.accident_type && d.accident_type !== filters.accident_type) dist++;
        // if (filters.deadly && d.deadly !== filters.deadly) dist++;
        // if (filters.hour && d.hour !== filters.hour) dist++;
        // if (filters.week_day && d.week_day !== filters.week_day) dist++;
        // if (filters.month && d.month !== filters.month) dist++;
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
                v => d3.sum(v, d => d.observation),
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
        // makeChart({
        //     svg: svgRegion,
        //     accessor: d => d.region,
        //     filterKey: 'region',
        //     x: xRegion,
        //     y: yRegion,
        //     xAxis: xAxisRegion,
        //     yAxis: yAxisRegion,
        //     sort: (a, b) =>
        //         d3.descending(
        //             d3.sum(a.stacks, s => s.value),
        //             d3.sum(b.stacks, s => s.value)
        //         )
        // }),
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
        // makeChart({
        //     svg: svgDeadly,
        //     accessor: d => d.deadly,
        //     filterKey: 'deadly',
        //     x: xDeadly,
        //     y: yDeadly,
        //     xAxis: xAxisDeadly,
        //     yAxis: yAxisDeadly
        // }),
        // makeChart({
        //     svg: svgHour,
        //     accessor: d => d.hour,
        //     filterKey: 'hour',
        //     x: xHour,
        //     y: yHour,
        //     xAxis: xAxisHour,
        //     yAxis: yAxisHour
        // }),
        // makeChart({
        //     svg: svgWeekDay,
        //     accessor: d => d.week_day,
        //     filterKey: 'week_day',
        //     x: xWeekDay,
        //     y: yWeekDay,
        //     xAxis: xAxisWeekDay,
        //     yAxis: yAxisWeekDay
        // }),
        // makeChart({
        //     svg: svgMonth,
        //     accessor: d => d.month,
        //     filterKey: 'month',
        //     x: xMonth,
        //     y: yMonth,
        //     xAxis: xAxisMonth,
        //     yAxis: yAxisMonth
        // })
    ];

    function updateAll() {
        charts.forEach(c => c());
    }

    // ---------- INITIAL RENDER ----------
    updateAll();
    // container.region.append(svgRegion.node());
    container.intersection.append(svgIntersection.node());
    container.accidentType.append(svgAccidentType.node());
    // container.deadly.append(svgDeadly.node());
    // container.hour.append(svgHour.node());
    // container.weekDay.append(svgWeekDay.node());
    // container.month.append(svgMonth.node());
}
