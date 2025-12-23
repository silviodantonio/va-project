import * as d3 from 'd3';

// Putting async here otherwise a warning is raised when fetching data
export default async function main () {
    const container = document.getElementById('pca-container');

    const data = await d3.csv("http://localhost:7000/accidents_region_pca.csv", d => {
            // Converting from string to integer
            d.x_pca =  +d.x_pca;
            d.y_pca = +d.y_pca;
            return d
        }
    );

    // Set up dimensions with margins for axes
    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;
    const datamargin = 1;

    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height);

    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.x_pca) - datamargin, d3.max(data, d => d.x_pca) + datamargin])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.y_pca) - datamargin, d3.max(data, d => d.y_pca) + datamargin])
        .range([height - marginBottom, marginTop]);

    // Here we need something smarter
    const colorCategory = d3.scaleOrdinal()
        .domain(["0", "1"])
        .range([ "#5165b7ff", "#e12d2dff"])

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
        .attr('opacity', 0.7)
        .attr('fill', d => colorCategory(d.deadly))

    container.append(svg.node());

}