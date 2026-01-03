import * as d3 from "d3";
import {REGION_LIST, WEEK_DAY_LIST, MONTH_LIST,HOUR_LIST} from './constants.js';
import {catColors, catColorsDesat} from "./helpers.js";

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
    const data = await d3.csv(
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
    ctx.globalAlpha = 0.7;
    
    // Draw PCA for the first time
    const coloringSelector = document.querySelector('#colorSelector');
    let coloringAttribute = coloringSelector.value;
    drawBaseCanvas(ctx, data, coloringAttribute);

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


    // /* ============================
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
   HeatMap-MonthWeeks-PCA connection
============================ */

document.addEventListener("heatmap_month-weeks_multi-select", function(event) {

    const week_day = event.detail.week_days;
    const month = event.detail.months;
    console.log("Month clicked:", month);
    console.log("Week day clicked:", week_day);

    // reset della selezione della regione cliccata
    ctx.clearRect(0, 0, width, height); 



    // Draw all points normally
    for (const d of data) {
        ctx.fillStyle = catColors[d[coloringAttribute]];
        ctx.globalAlpha = 0.7;
        drawCircle(ctx, d.x, d.y, 3);
    }

    for (let i = 0; i < week_day.length; i++) {
        const wdIndex = WEEK_DAY_LIST.indexOf(week_day[i]) + 1;
        const mthIndex = MONTH_LIST.indexOf(month[i]) + 1;

        console.log("Week day index:", wdIndex);
        console.log("Month index:", mthIndex);

        for (const d of data) {
            if (+d.week_day === wdIndex && +d.month === mthIndex) {
                ctx.fillStyle = "orange";
                ctx.globalAlpha = 0.7;
                drawCircle(ctx, d.x, d.y, 4);
            }
        }
    }
});

/* =================================
   HeatMap-WeekHours-PCA connection
====================================*/

document.addEventListener('heatmap_week-hours_multi-select', function(event) {

    const week_days = event.detail.days;   // array of selected days
    const hours = event.detail.hours;      // array of selected hours

    console.log("Week days clicked:", week_days);
    console.log("Hours clicked:", hours);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw all points normally
    for (const d of data) {
        ctx.fillStyle = catColors[d[coloringAttribute]];
        ctx.globalAlpha = 0.7;
        drawCircle(ctx, d.x, d.y, 3);
    }

    // Highlight selected cells
    for (let i = 0; i < week_days.length; i++) {
        const wdIndex = WEEK_DAY_LIST.indexOf(week_days[i]) + 1;
        const hrIndex = HOUR_LIST.indexOf(hours[i]) + 1;

        console.log("Week day index:", wdIndex);
        console.log("Hour index:", hrIndex);

        for (const d of data) {
            if (+d.week_day === wdIndex && +d.hour === hrIndex) {
                ctx.fillStyle = "orange";
                ctx.globalAlpha = 0.7;
                drawCircle(ctx, d.x, d.y, 4);
            }
        }
    }
});


/* ============================
    Mount layers
============================ */

    container.appendChild(canvas);
    container.appendChild(svg.node());
}

export default main;
