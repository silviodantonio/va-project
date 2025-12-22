import * as d3 from 'd3';

// Putting async here otherwise a warning is raised when fetching data
export default async function main () {
    const container = document.getElementById('pca-container');

    const data = await d3.csv("http://localhost:7000/accidents_region_pca.csv", d => (
        {
            x_pca: +d.x_pca,
            y_pca: +d.y_pca
        }
    ));

    // Set up dimensions with margins for axes
    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.x_pca), d3.max(data, d => d.x_pca)])        // Not clear how d3.max() works
        .range([marginLeft, width - marginRight]);     // SGV maps 0,0 in top left. Bottom left corner has

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.y_pca), d3.max(data, d => d.y_pca)])        // Not clear how d3.max() works
        .range([height - marginBottom, marginTop]);     // SGV maps 0,0 in top left. Bottom left corner has
                                                        // a "high" pixel position

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`)     // Not clear what this is doing
        .call(d3.axisBottom(x));                                        // Draw axis with given scale on bottom

    // Add Y axis
    svg.append('g')
        .attr('transform', `translate(${marginLeft},0)`)    // Not clear what this is doing
        .call(d3.axisLeft(y));

    // Create bars using ONLY enter()
    svg.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.x_pca))
        .attr('cy', d => y(d.y_pca))
        .attr('r', 3)
        .attr('fill', 'steelblue');

    container.append(svg.node());
}