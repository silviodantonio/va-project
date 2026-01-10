import * as d3 from "d3";
import {labels, REGION_LIST, WEEK_DAY_LIST, MONTH_LIST,HOUR_LIST, DEADLY_LIST} from './constants.js';
import { updateSelection, selectionStore, computeActiveSelection } from "./selectionStore.js";
import { drawPcaDensityLegends, drawCatLegends } from "./legendUtils.js";
import {
    dataSet,
    drawPCA,
    catColors,
    densityColors,
    observationColors, observationColorsDesat,
} from "./pcaHelpers.js";
import { getSelectionPercentage, initIdMap, updatePercentageUI } from "./percentage.js";

let ctxObj = null;

function drawPCALegends(svg, xPos, yPos, coloringAttribute) {

    if (coloringAttribute === 'density') {
        drawPcaDensityLegends(svg, xPos, yPos, 
            0, 1, 7,
            densityColors
        );
    }
    else if (coloringAttribute === "observation") {
        let obsMin = observationColors.domain()[0];
        let obsMax = Math.max(...observationColors.domain())
        drawPcaDensityLegends(svg, xPos, yPos,
            obsMin, obsMax, 7,
            observationColors
        );
    }
    else {
        drawCatLegends(svg, xPos, yPos + 4, 
            labels[coloringAttribute], catColors, legendClickedCallback);
    }

}

const data = dataSet.default;

// Ordering of datapoints in raisedData will be changed by
// legendClickedCallback()
let raisedData = dataSet.default

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

    // Set domain for observation color scales
    const [obsMin, obsMax] = d3.extent(data, d => d.observation);
    observationColors.domain([obsMin, obsMax]);
    observationColorsDesat.domain([obsMin, obsMax]);

    // Precompute element positions on PCA
    data.forEach(d => {
        d.x = x(d.x_pca);
        d.y = y(d.y_pca);
    });

    /* ============================
       SVG layer
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
    //    Brushing
    // ============================ */

    const brush = d3.brush()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("brush end", (event) => brushCallback(event, data))

    const brushG = svg.append('g').attr("class", "brush").call(brush);


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

    ctxObj = {
        ctx: ctx,
        width: canvas.width,
        height: canvas.height,
    };

    // Get coloring attribute
    const coloringSelector = document.querySelector('#colorSelector');
    let coloringAttribute = coloringSelector.value;
    
    // Draw PCA for the first time
    drawPCALegends(svg, margin.right + 40, margin.top + 20, coloringAttribute);
    drawPCA(ctxObj, data, null, coloringAttribute);

    // Event listener for recoloring when changing selected attribute
    coloringSelector.addEventListener('change', (e) => {
        coloringAttribute = e.target.value;

        drawPCALegends(svg, margin.right + 40, margin.top + 20, coloringAttribute);
        drawPCA(ctxObj, data, selectionStore.pca, coloringAttribute);

    });



    /* ============================
        React to selection changes
    ============================ */

    document.addEventListener("clear-pca-brush", () => {
        if (selectionStore.pca != null) {
            selectionStore.pca = null;
            brushG.call(brush.move, null);
            drawPCA(ctxObj, data, null, coloringAttribute);
            updatePercentageUI(null, 0);
        }
    });

    document.addEventListener("selection-changed", (event) => {
        const { store } = event.detail;

        const activeSelection = computeActiveSelection(store);
      
        drawPCA(ctxObj, data, activeSelection, coloringAttribute);
        const {fraction, percentage} = getSelectionPercentage(activeSelection);
        updatePercentageUI(fraction, percentage);
    });


    /* ============================
        Mount layers
    ============================ */

    container.appendChild(canvas);
    container.appendChild(svg.node());
}

function brushCallback(event, data) {

    const POINT_RADIUS = 3;

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
    else {
        updatePercentageUI(null,0);
    }

    // RESET all other selections
    for (const key in selectionStore) {
        if (key !== "pca") {
            selectionStore[key] = null;
        }
    }
    updateSelection("pca", selectedIds);

}

function legendClickedCallback(d) {
    let coloringAttribute = document.querySelector('#colorSelector').value;
    let raiseValue = labels[coloringAttribute].indexOf(d);
    console.log(`Clicked on index ${raiseValue} of attribute ${coloringAttribute}`);

    let backroundData = raisedData.filter(d => d[coloringAttribute] !== raiseValue)
    raisedData = backroundData.concat(data.filter(d => d[coloringAttribute] == raiseValue))

    drawPCA(ctxObj, raisedData, selectionStore.pca, coloringAttribute);
}

export default main;