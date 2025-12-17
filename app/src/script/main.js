import * as d3 from 'd3';

import '../style/main.css';

const data = [
    { label: 'A', value: 30 },
    { label: 'B', value: 80 },
    { label: 'C', value: 45 },
    { label: 'D', value: 60 },
    { label: 'E', value: 20 },
    { label: 'F', value: 90 },
    { label: 'G', value: 50 }
];

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

// Create scales
const x = d3.scaleBand()                        // Type of scale (ordinal, continuos, temporal... )
    .domain(data.map(d => d.label))             // Values that can be found in data
    .range([marginLeft, width - marginRight])  // Position (in pixel) to map data on screen
    .padding(0.2);

const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])        // Not clear how d3.max() works
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
svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.label))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => y(0) - y(d.value))
    .attr('fill', 'steelblue');

container.append(svg.node());   // This is magic. What is container?

const text_graph = d3.create('svg')
    .attr('width', width)
    .attr('height', height)

const letters = ['a', 'b', 'c', 'd']

text_graph.selectAll('.myChars')    // Create a new selection (now it's empty)
    .data(letters)                  // Bind data to the selection
    .enter()                        // Magic method that creates new elemens to selection for every new data element
    .append('text')                 // Add a SVG text element for each node
    .attr('x', (_d, i) => i * 30)   // Set the X position for each element
    .attr('y', _d => 30)            // Set the Y position for each element
    .text(d => d)

container.append(text_graph.node())