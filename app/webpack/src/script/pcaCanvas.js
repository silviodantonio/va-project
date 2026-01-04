import * as d3 from "d3";
import {REGION_LIST, WEEK_DAY_LIST, MONTH_LIST,HOUR_LIST} from './constants.js';
import {catColors, catColorsDesat} from "./helpers.js";

const seqColors = d3.schemePuBu[9];

/* ===========================
   Canvas helper
============================ */

function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draws a scatterplot on the specified canvas context using the given data.
 * Uses different colors for every value in coloringAttribute.
 * Requires data to have an attribute named `x` and `y`.
 **/
function drawBaseCanvas(ctx, data, coloringAttribute) {

    // Draw new content
    for (const d of data) {
        ctx.fillStyle = catColors[d[coloringAttribute]];
        drawCircle(ctx, d.x, d.y, 3);
        ctx.fill();
    }

    console.log('New canvas drawn');
}

function drawDensityScatter(ctx, data, quantizeX, quantizeY) {

    // Initialize density matrix
    let densityMatrix = [];
    for (let i = 0; i < quantizeX; i++) {
        let yRow = new Array(quantizeY).fill(0)
        densityMatrix.push(yRow);
    }

    let [xMin, xMax] = d3.extent(data, d => d.x_pca);
    let [yMin, yMax] = d3.extent(data, d => d.y_pca);

    // Solves an issue with the index assigned to the element with Max.
    // Probably there's a more elegant way of doing that but I 
    // couldn't come up with one
    const eps = 0.1;
    xMax += eps;
    yMax += eps;

    const binSizeX = (xMax - xMin) / quantizeX;
    const binSizeY = (yMax - yMin) / quantizeY;

    let xBin = 0;
    // Count the number of elements per X band.
    // Assume data is sorted over x_pca in ascending order.
    for (const d of data) {
        // Compute y position of current point
        let yBin = Math.floor((d.y_pca - yMin) / binSizeY);

        // If x_pca is still in the current xBin
        if (d.x_pca < xMin + (xBin+1) * binSizeX ) {
            // Update counter for yBin
            densityMatrix[xBin][yBin]++;
        }
        else {
            // Go to next xBin
            xBin++;
            densityMatrix[xBin][yBin]++
        }
    }

    for (let i = 0; i < densityMatrix.length; i++) {
        console.log(densityMatrix[i]);
    }

    // color scale for drawing points
    const color = d3.scaleSequential(d3.interpolatePuBu);

    // Compute color matrix
    let maxDensity = 0;
    densityMatrix.forEach(d => {
        let dataMax = Math.max(...d);
        if (dataMax > maxDensity) {
            maxDensity = dataMax;
        }
    });

    console.log(maxDensity);
    let normalizingFactor = 1 / maxDensity;
    console.log(`Normalizing factor: ${normalizingFactor}`);

    let colorMatrix = Array.from(densityMatrix)
    colorMatrix = colorMatrix.map(row => row.map(d => color(d * normalizingFactor)));

    for (let i = 0; i < colorMatrix.length; i++) {
        console.log(colorMatrix[i]);
    }

    // Draw scatterplot with points colored according to density

    xBin = 0;
    for (const d of data) {
        // Compute y position of current point
        let yBin = Math.floor((d.y_pca - yMin) / binSizeY);

        // If x_pca is still in the current xBin
        if (d.x_pca < xMin + (xBin+1) * binSizeX ) {
            ctx.fillStyle = colorMatrix[xBin][yBin];
        }
        else {
            // Go to next xBin
            xBin++;
            ctx.fillStyle = densityMatrix[xBin][yBin];
        }

        drawCircle(ctx, d.x, d.y, 3);
        ctx.fill();
    }

}


/* ============================
   Main
============================ */

async function main() {
    const container = document.getElementById("pca-container");
    container.style.position = "relative";

    const width = container.clientWidth ;
    const height = container.clientHeight;

    const margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };

    // Load data
    let data = await d3.csv(
        "http://127.0.0.1:7000/accidents_region_pca.csv",
        d => ({
            ...d,
            x_pca: +d.x_pca,
            y_pca: +d.y_pca,
        })
    );

    /* ============================
       Scales (margins live HERE)
    ============================ */

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x_pca))
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y_pca))
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Precompute element positions
    data.forEach(d => {
        d.x = x(d.x_pca);
        d.y = y(d.y_pca);
    });

    // Sort data, required for drawing scatterplot using density map
    data = d3.sort(data, (d) => d.x_pca);
    for (let i = 0; i <= 10; i++) {
        console.log(`${data[i].x_pca}`)
    }


    /* ============================
       SVG layer (axes only)
    ============================ */

    const svg = d3.create("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("position", "absolute")
        .style("top", 0)
        .style("left", 0)
        .style("width", "100%")
        .style("height", "auto")
        .style("z-index", 1);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    /* ============================
       Canvas layer (points only)
    ============================ */

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // to check for high-DPI screens
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.zIndex = -1;

    ctx.scale(dpr, dpr);
    ctx.globalAlpha = 0.05;
    
    // Draw PCA for the first time
    const coloringSelector = document.querySelector('#colorSelector');
    let coloringAttribute = coloringSelector.value;
    // drawBaseCanvas(ctx, data, coloringAttribute);
    drawDensityScatter(ctx, data, 200, 140);

    // Event listener for recoloring when changing selected attribute
    coloringSelector.addEventListener('change', (e) => {
        // Get new attribute for coloring new value
        coloringAttribute = e.target.value;

        // Clear previous brushing selection
        svg.select('.brush').call(brush.move, null);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Redraw using new colors
        console.log(`Recoloring using ${coloringAttribute}`);
        drawBaseCanvas(ctx, data, coloringAttribute);
    })


    /* ============================
    //    Brushing
    // ============================ */

    const brush = d3.brush()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("start brush end", ({selection}) => {

        // If something is selected
        if (selection) {

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Extract selection coordinates
            const [[x0, y0], [x1, y1]] = selection;

            for (const d of data) {
                const isSelected =
                    d.x > x0 && d.x < x1 &&
                    d.y > y0 && d.y < y1;

                if(!isSelected) {
                    // Color points outside selection with desaturated colors
                    ctx.fillStyle = catColorsDesat[d[coloringAttribute]];
                    drawCircle(ctx, d.x, d.y, 3);
                } else  {
                    // Color points inside selection with standard colors
                    ctx.fillStyle = catColors[d[coloringAttribute]];
                    drawCircle(ctx, d.x, d.y, 3);
                }
            }
        }
        else {
            drawBaseCanvas(ctx, data, coloringAttribute);
        }
    });

    svg.append('g').attr("class", "brush").call(brush);


/* ============================
   Map-PCA connection
============================ */

document.addEventListener('region-click', function(event) {
    const regionName = event.detail.regionName;
    console.log("Region clicked:", regionName);
    
    // Get the region index from the region name
    // const region_list = ["Piemonte", "Valle d'Aosta / Vallée d'Aoste", "Liguria", "Lombardia", "Trentino Alto Adige / Südtirol", "Veneto", "Friuli-Venezia Giulia", "Emilia-Romagna", "Toscana", "Umbria", "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"];
    const regionIndex = REGION_LIST.indexOf(regionName) + 1; // +1 because your region codes start at 1

    // reset della selezione della regione cliccata
    ctx.clearRect(0, 0, width, height);

    // Draw all points
    for (const d of data) {

        if (+d.region !== regionIndex){
            ctx.fillStyle = catColors[d[coloringAttribute]];
            ctx.globalAlpha = 0.7;
            drawCircle(ctx, d.x, d.y, 3);
        }
    }
    for (const d of data) {
        if (+d.region === regionIndex){
            ctx.fillStyle = "orange";
            ctx.globalAlpha = 0.7;
            drawCircle(ctx, d.x, d.y, 3);
        }
    }
});

/* ============================
   HeatMap-PCA connection
============================ */
const selectionState = {
    source: null, // 'week-hours' | 'month-weeks'
    weekHours: null,
    monthWeeks: null
};
function redrawPCA() {
    ctx.clearRect(0, 0, width, height);

    for (const d of data) {
        ctx.fillStyle = catColors[d[coloringAttribute]];
        ctx.globalAlpha = 0.7;
        drawCircle(ctx, d.x, d.y, 3);
    }

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "orange";

    if (selectionState.source === "week-hours" && selectionState.weekHours) {
        const { days, hours } = selectionState.weekHours;

        for (let i = 0; i < days.length; i++) {
            const wdIndex = WEEK_DAY_LIST.indexOf(days[i]) + 1;
            const hrIndex = HOUR_LIST.indexOf(hours[i]) + 1;

            for (const d of data) {
                if (+d.week_day === wdIndex && +d.hour === hrIndex) {
                    drawCircle(ctx, d.x, d.y, 4);
                }
            }
        }
    }

    if (selectionState.source === "month-weeks" && selectionState.monthWeeks) {
        const { months, week_days } = selectionState.monthWeeks;

        for (let i = 0; i < months.length; i++) {
            const mIndex = MONTH_LIST.indexOf(months[i]) + 1;
            const wdIndex = WEEK_DAY_LIST.indexOf(week_days[i]) + 1;

            for (const d of data) {
                if (+d.month === mIndex && +d.week_day === wdIndex) {
                    drawCircle(ctx, d.x, d.y, 4);
                }
            }
        }
    }
}

document.addEventListener("heatmap_week-hours_multi-select", (event) => {

    selectionState.source = "week-hours";
    selectionState.weekHours = {
        days: event.detail.days,
        hours: event.detail.hours
    };
    selectionState.monthWeeks = null;

    document.dispatchEvent(new CustomEvent("reset-month-weeks"));

    redrawPCA();
});

document.addEventListener("heatmap_month-weeks_multi-select", (event) => {

    selectionState.source = "month-weeks";
    selectionState.monthWeeks = {
        months: event.detail.months,
        week_days: event.detail.week_days
    };
    selectionState.weekHours = null;

    document.dispatchEvent(new CustomEvent("reset-week-hours"));

    redrawPCA();
});




/* ============================
    Mount layers
============================ */

    container.appendChild(canvas);
    container.appendChild(svg.node());
}

export default main;
