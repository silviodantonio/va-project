import * as d3 from 'd3';

// Draw solid circles on canvas
function drawCircle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fill();
}

// Draw line on canvas
function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// Draw text on canvas
function drawText(ctx, text, x, y, align = 'left', baseline = 'alphabetic') {
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
}

async function main() {
    const container = document.getElementById('pca-container');
    
    const data = await d3.csv("http://127.0.0.1:7000/accidents_region_pca.csv", d => {
        d.x_pca = +d.x_pca;
        d.y_pca = +d.y_pca;
        return d;
    });

    // Set up dimensions with margins
    const width = 640;
    const height = 450;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // First get the actual data ranges
    const xMinData = d3.min(data, d => d.x_pca);
    const xMaxData = d3.max(data, d => d.x_pca);
    const yMinData = d3.min(data, d => d.y_pca);
    const yMaxData = d3.max(data, d => d.y_pca);

    // Calculate padding based on data range (percentage of range)
    const xRange = xMaxData - xMinData;
    const yRange = yMaxData - yMinData;
    const paddingFactor = 0.1; // 10% padding
    
    // Create scales with proportional padding
    const x = d3.scaleLinear()
        .domain([xMinData - xRange * paddingFactor, xMaxData + xRange * paddingFactor])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([yMinData - yRange * paddingFactor, yMaxData + yRange * paddingFactor])
        .range([height - marginBottom, marginTop]);

    // Draw X axis
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    drawLine(ctx, marginLeft, height - marginBottom, width - marginRight, height - marginBottom);
    
    // Draw Y axis
    drawLine(ctx, marginLeft, marginTop, marginLeft, height - marginBottom);

    // Draw axis ticks and labels
    ctx.fillStyle = 'black';
    ctx.font = '10px sans-serif';
    
    // Get integer range for x axis
    const xMin = Math.floor(x.domain()[0]);
    const xMax = Math.ceil(x.domain()[1]);
    
    // Create array of integers from min to max
    const xIntTicks = [];
    for (let i = xMin; i <= xMax; i++) {
        xIntTicks.push(i);
    }
    
    // Draw x ticks and labels
    xIntTicks.forEach(tick => {
        const xPos = x(tick);
        // Only draw if within canvas bounds (with small buffer)
        if (xPos >= marginLeft - 1 && xPos <= width - marginRight + 1) {
            // Tick line
            drawLine(ctx, xPos, height - marginBottom, xPos, height - marginBottom + 5);
            // Tick label - show as integer (no decimal)
            drawText(ctx, tick.toString(), xPos, height - marginBottom + 15, 'center', 'top');
        }
    });

    // Draw Y axis ticks and labels - integer ticks only
    const yMin = Math.floor(y.domain()[0]);
    const yMax = Math.ceil(y.domain()[1]);
    
    // Create array of integers from min to max
    const yIntTicks = [];
    for (let i = yMin; i <= yMax; i++) {
        yIntTicks.push(i);
    }
    
    // Draw y ticks and labels
    yIntTicks.forEach(tick => {
        const yPos = y(tick);
        // Only draw if within canvas bounds (with small buffer)
        if (yPos >= marginTop - 1 && yPos <= height - marginBottom + 1) {
            // Tick line
            drawLine(ctx, marginLeft - 5, yPos, marginLeft, yPos);
            // Tick label - show as integer (no decimal)
            drawText(ctx, tick.toString(), marginLeft - 10, yPos, 'right', 'middle');
        }
    });



    // Draw points with smaller radius to reduce overlap
    data.forEach(d => {
        const xPos = x(d.x_pca);
        const yPos = y(d.y_pca);
        
        // Color based on deadly attribute
        ctx.fillStyle = d.deadly === '1' ? '#e12d2d' : '#5165b7';
        drawCircle(ctx, xPos, yPos, 2.5); // Reduced from 3 to 2.5
    });

    // Add to container
    container.append(canvas);
}

export default main;