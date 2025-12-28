import * as d3 from "d3";

/* ============================
   Canvas helper
============================ */

function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
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

    /* ============================
       Load data
    ============================ */

    const data = await d3.csv(
        "http://127.0.0.1:7000/accidents_region_pca.csv",
        d => ({
            ...d,
            x_pca: +d.x_pca,
            y_pca: +d.y_pca
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

    // Precompute pixel positions
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

    // Draw points once
    for (const d of data) {
        ctx.fillStyle = d.deadly === "0" ? "steelblue" : "red";
        drawCircle(ctx, d.x, d.y, 3);
    }


    /* ============================
       Brushing
    ============================ */
    const brush = d3.brush()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("start brush end", ({selection}) => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // If nothing selected, draw all normally
        if (!selection) {
            ctx.globalAlpha = 1;
            for (const d of data) {
                ctx.fillStyle = d.deadly === "0" ? "steelblue" : "red";
                drawCircle(ctx, d.x, d.y, 3);
            }
            return;
        }

        // Extract selection coordinates
        const [[x0, y0], [x1, y1]] = selection;

        for (const d of data) {
            const isSelected =
                d.x >= x0 && d.x <= x1 &&
                d.y >= y0 && d.y <= y1;

            // Fade non-selected points
            ctx.globalAlpha = isSelected ? 1 : 0.4;

            // Selected points appear orange
            ctx.fillStyle = isSelected ? "orange" : (d.deadly === "0" ? "steelblue" : "red");

            drawCircle(ctx, d.x, d.y, 3);
        }

        // Reset
        ctx.globalAlpha = 1;
    });

svg.append("g").call(brush);



    /* ============================
       Mount layers
    ============================ */


    container.appendChild(canvas);
    container.appendChild(svg.node());
}

export default main;
