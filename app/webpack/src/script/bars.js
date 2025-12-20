import * as d3 from 'd3';

export default async function main () {
    title.innerHTML = 'Incidenti stradali - dettaglio regionale';
    const container = document.getElementById('container');
    let data = await d3.csv("http://127.0.0.1:7000/accidents_region.csv");

    // Set up dimensions with margins for axes
    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 110;
    const marginLeft = 60;

    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Rollup sum of accidents per region
    data = d3.rollup(
        data,
        v => d3.sum(v, d => +d.observations),
        d => d.area_desc
    );
    
    data = Array.from(data, ([key, value]) => ({ area_desc: key, observations: value }));
    data.sort((a, b) => d3.descending(a.observations, b.observations));

    const x = d3.scaleBand()
        .domain(data.map(d => d.area_desc))
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.observations)])
        .range([height - marginBottom, marginTop]);

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('text-anchor', 'end')
        .attr('transform', 'rotate(-45)')
        .attr('dx', '-0.6em')
        .attr('dy', '0.15em');

    
    // Add Y axis
    svg.append('g')
        .attr('transform', `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    // Create bars using ONLY enter()
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.area_desc))
        .attr('y', d => y(d.observations))
        .attr('width', x.bandwidth())
        .attr('height', d => y(0) - y(d.observations))
        .attr('fill', 'steelblue');

    container.append(svg.node());
}