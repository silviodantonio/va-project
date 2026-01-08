import * as d3 from "d3";
import {labels, REGION_LIST, WEEK_DAY_LIST, MONTH_LIST,HOUR_LIST, DEADLY_LIST} from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection } from "./selectionStore.js";
import { drawPcaDensityLegends, drawCatLegends } from "./legendUtils.js";
import {
    attachDensityIndex,
    drawPoints,
    catColors,
    densityColors
} from "./pcaHelpers.js";
import { getSelectionPercentage, initIdMap, updatePercentageUI } from "./percentage.js";




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

    const POINT_RADIUS = 3;

    // Load data
    let data = await d3.csv(
        "http://127.0.0.1:7000/accidents_region_pca.csv",
        (d, i) => ({
            ...d,
            id: i,           // <-- generate unique ID based on row index
            x_pca: +d.x_pca,
            y_pca: +d.y_pca,
            intersection: +d.intersection - 1,
            accident_type: +d.accident_type - 1,
            deadly: +d.deadly,
            week_day: +d.week_day - 1,
            observation: +d.observation,
        })
    );

    initIdMap(data);

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

    data = attachDensityIndex(data, 600, 420);
    const dataSortedByDensity = d3.sort(data, d => d.density);

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

    if (coloringAttribute === 'density') {
        drawPcaDensityLegends(svg, margin.left + 20, margin.top + 10, 
            0, 1, 7,
            densityColors
        );
    }
    else {
        drawCatLegends(svg, margin.left + 20, margin.top + 20, labels[coloringAttribute], catColors);
    }
    updatePCA(data, null);

    // Event listener for recoloring when changing selected attribute
    coloringSelector.addEventListener('change', (e) => {
        coloringAttribute = e.target.value;

        // Redraw using new colors
        console.log(`Recoloring using ${coloringAttribute}`);

        if (coloringAttribute == "density") {
            drawPcaDensityLegends(svg, margin.left + 15, margin.top + 10,
                0, 1, 7,
                densityColors
            );
        } else {
            drawCatLegends(svg, margin.left + 20, margin.top + 20, labels[coloringAttribute], catColors)
        }

        updatePCA(data, selectionStore.pca); 

    });


    /* ============================
    //    Brushing
    // ============================ */

   const brush = d3.brush()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("brush end", (event) => {
            const { selection, type } = event;

            if (!event.sourceEvent) return;

            let selectedIds = null;

            if (selection) {
                const [[x0, y0], [x1, y1]] = selection;

                selectedIds = new Set(
                    data
                        .filter(d =>
                            d.x - POINT_RADIUS >= x0 &&
                            d.x + POINT_RADIUS <= x1 &&
                            d.y - POINT_RADIUS >= y0 &&
                            d.y + POINT_RADIUS <= y1
                        )
                        .map(d => d.id)
                );
                const {fraction, percentage} = getSelectionPercentage(selectedIds);
                updatePercentageUI(fraction, percentage);
            }
            else{
                updatePercentageUI(null,0);
            }
            // RESET all other selections
            for (const key in selectionStore) {
                if (key !== "pca") {
                    selectionStore[key] = null;
                }
            }
            // This is to trigger other graph's update only at the end of the brush 
            // if (type === "brush") {
            //     updatePCA(data, selectedIds);
            // } else {
            //     updateSelection("pca", selectedIds);
            // }

            updateSelection("pca", selectedIds);
    });

    function updatePCA(data, selectedIds = null) {
        ctx.clearRect(0, 0, width, height);

        const hasSelection = selectedIds && selectedIds.size > 0;
        const mode = coloringAttribute === "density" ? "density" : "categorical";
        const baseOrder = mode === "density" ? dataSortedByDensity : data;

        if (!hasSelection) {
            drawPoints({ ctx, data: baseOrder, coloringAttribute, saturated: true, mode });
            return;
        }

        // Draw unselected (bottom)
        drawPoints({
            ctx,
            data: baseOrder.filter(d => !selectedIds.has(d.id)),
            coloringAttribute,
            saturated: false,
            mode
        });

        // Draw selected (top)
        drawPoints({
            ctx,
            data: baseOrder.filter(d => selectedIds.has(d.id)),
            coloringAttribute,
            saturated: true,
            mode
        });
    }

    const brushG = svg.append('g').attr("class", "brush").call(brush);

    /* ============================
        React to selection changes
    ============================ */

    document.addEventListener("clear-pca-brush", () => {
        if (selectionStore.pca != null) {
            selectionStore.pca = null;
            brushG.call(brush.move, null);
            updatePCA(data, null);
            updatePercentageUI(null, 0);
        }
    });

    document.addEventListener("selection-changed", (event) => {
        const { store } = event.detail;

        const activeSelection = computeActiveSelection(store);
      
        updatePCA(data, activeSelection);
        const {fraction, percentage} = getSelectionPercentage(activeSelection);
        updatePercentageUI(fraction, percentage);
    });


    /* ============================
        Mount layers
    ============================ */

    container.appendChild(canvas);
    container.appendChild(svg.node());
}

export default main;