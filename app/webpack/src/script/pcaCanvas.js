import * as d3 from 'd3';

// Draw solid circles on given canvas
function drawCircle(ctx, cx, cy, r) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fill()
}

// Putting async here otherwise a warning is raised when fetching data
async function main () {
    const container = document.getElementById('pca-container');

    const data = await d3.csv("http://127.0.0.1:7000/accidents_region_pca.csv", d => {
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
    const dataMargin = 1;

    const svg = d3.create('svg')
        .attr('width', width)
        .attr('height', height)
        .style('z-index',1);

    // Set up canvas witdth and positioning
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', width );
    canvas.setAttribute('height', height );
    canvas.style.zIndex = -1;
    canvas.style.position = 'absolute';
    canvas.style.top = marginTop +'px';
    canvas.style.left = marginLeft;
    //Get canvas context, used for drawing
    const ctx = canvas.getContext('2d');

    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.x_pca - dataMargin), d3.max(data, d => d.x_pca + dataMargin)])
        .range([marginLeft, width - marginRight]);

    // const x = d3.scaleLinear()
    //     .domain([d3.min(data, d => d.x_pca), d3.max(data, d => d.x_pca)])
    //     .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.y_pca - dataMargin), d3.max(data, d => d.y_pca + dataMargin)])
        .range([height - marginBottom, marginTop]);

    // Precompute x and y positions in order to reduce calls to scale functions.
    data.forEach((d) => {
        d.x = x(d.x_pca);
        d.y = y(d.y_pca);
        return d;
    });

    // Here we need something smarter
    const colorCategory = d3.scaleOrdinal()
        .domain(["0", "1"])
        .range([ "#5165b7ff", "#e12d2dff"])

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    // Add Y axis
    svg.append('g')
        .attr('transform', `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    // Dots are drawn on a canvas element set as overlay
    for (const d of data) {
        d.deadly === '0' ? ctx.fillStyle = 'steelblue' : ctx.fillStyle = 'red';
        drawCircle(ctx, d.x, d.y, 3);
    }

    //Brushing
    svg.call(d3.brush().extent([[0, 0], [width, height]]));



    container.append(canvas);
    container.append(svg.node());
    


}

export default main;



