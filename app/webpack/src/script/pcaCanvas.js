import * as d3 from "d3";
import { color, hsl } from "d3-color";
import {REGION_LIST, WEEK_DAY_LIST, MONTH_LIST,HOUR_LIST} from './constants.js';
  // Convert HSL back to RGB (Magic part 2)

/* ============================
   Canvas helper
============================ */

function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function desatAndLighten(hexColor, desaturate, lighten) {
  
  // Remove the hash if present
  let hex = hexColor.replace(/^#/, '');
  
  // Convert hex into a value between 0 and 1
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Magic for converting HEX into HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }
  
  // Adjust saturation
  s = s * (1 - desaturate);
  
  // Adjust lightness
  if (lighten > 0) {
    // Lighten: move towards 1
    l = l + (1 - l) * lighten;
  } else if (lighten < 0) {
    // Darken: move towards 0
    l = l + l * lighten;
  }
  
  // Clamp values
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  
  
  const [newR, newG, newB] = hslToRgb(h, s, l);
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

const hslToRgb = (h, s, l) => {

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const catColors = [
    '#377eb8',
    '#e41a1c',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf',
    '#999999'
];

// build array of Desaturated colors
const catColorsDesat = [];
catColors.forEach(d => catColorsDesat.push(desatAndLighten(d, 0.3, 0.7)));

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
    ctx.globalAlpha = 0.7;

    // Draw points once
    for (const d of data) {
        ctx.fillStyle = catColors[d.accident_type];
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
            for (const d of data) {
                ctx.fillStyle = catColors[d.accident_type];
                drawCircle(ctx, d.x, d.y, 3);
            }
        }
        else {
            // Extract selection coordinates
            const [[x0, y0], [x1, y1]] = selection;

            for (const d of data) {
                const isSelected =
                    d.x > x0 && d.x < x1 &&
                    d.y > y0 && d.y < y1;

                if(!isSelected) {
                    ctx.fillStyle = catColorsDesat[d.accident_type];
                    drawCircle(ctx, d.x, d.y, 3);
                } else  {
                    ctx.fillStyle = catColors[d.accident_type];
                    drawCircle(ctx, d.x, d.y, 3);
                }

            }
        }
    });

svg.append("g").call(brush);


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
    ctx.clearRect(0, 0, width, height)

    // Draw all points
    for (const d of data) {

        if (+d.region !== regionIndex){
            ctx.fillStyle = catColors[d.accident_type];
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
        ctx.fillStyle = catColors[d.accident_type];
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
        ctx.fillStyle = catColors[d.accident_type];
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
