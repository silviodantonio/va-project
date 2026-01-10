import * as d3 from "d3";

// ----------------------------------
// Data objects and data manipulation
// ----------------------------------

const rawData = await d3.csv(
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

const data = attachDensityIndex(rawData, 600, 420);
const dataSortedByDensity = d3.sort(data, d => d.density);
const dataSortedByObservation = d3.sort(data, d => d.observation);

export const dataSet = {
    default: data,
    densitySorted: dataSortedByDensity,
    observationSorted: dataSortedByObservation,
}

function attachDensityIndex(data, quantizeX, quantizeY) {

    const densityMatrix = Array.from(
        { length: quantizeX },
        () => new Array(quantizeY).fill(0)
    );

    let [xMin, xMax] = d3.extent(data, d => d.x_pca);
    let [yMin, yMax] = d3.extent(data, d => d.y_pca);

    const eps = 1e-9;
    xMax += eps;
    yMax += eps;

    const binSizeX = (xMax - xMin) / quantizeX;
    const binSizeY = (yMax - yMin) / quantizeY;

    // Counting the number of data points for each block
    for (const d of data) {
        const xBin = Math.floor((d.x_pca - xMin) / binSizeX);
        const yBin = Math.floor((d.y_pca - yMin) / binSizeY);

        densityMatrix[xBin][yBin] += +d.observation;
    }

    // A factor that transforms density to a value between 0 and 1.
    // Needed for sequential color scales
    const normalizingFactor = 1 / d3.max(densityMatrix.flat());

    // Build new data with density value attached to each element
    const newData = data.map(d => {

        const xBin = Math.floor((d.x_pca - xMin) / binSizeX);
        const yBin = Math.floor((d.y_pca - yMin) / binSizeY);
        const density = densityMatrix[xBin][yBin] * normalizingFactor;

        return {...d, density: density}
    });

    return newData;
}

// -----------------------
// Colors and color scales
// -----------------------

function desatAndLighten(color, desaturate, lighten) {
  const hcl = d3.hcl(color);
  hcl.c *= desaturate;
  // hcl.l += (99 - hcl.l) * lighten;
  const adjustedLight = hcl.l + (99 - hcl.l) * lighten * (1 - hcl.l / 100);
  hcl.l = Math.min(99, adjustedLight);
  return hcl.formatHex();
}

export const catColors = d3.scaleOrdinal(d3.schemeCategory10);
export const catColorsDesat = d3.scaleOrdinal(d3.schemeCategory10.map(d => desatAndLighten(d3.color(d).formatHex(), 0.3, 0.7)));

const n = 20;
export const seqColors = Array.from({ length: n }, (_, i) => 
  // d3.interpolateCividis(i / (n - 1))
  // d3.interpolatePuBu(i / (n - 1))
  // d3.interpolateBlues(i / (n - 1))
  d3.interpolateInferno(i / (n - 1))
  // d3.interpolateViridis(i / (n - 1))
);

// build array of Desaturated colors
export const seqColorsDesat = seqColors.map((color) => desatAndLighten(color, 0.3, 0.7));

export const densityColors = d3.scaleQuantize([0, 1], seqColors)
export const densityColorsDesat = d3.scaleQuantize([0, 1], seqColors.map(d => {
    return desatAndLighten(d3.color(d).formatHex(), 0.3, 0.7)
}));

export const observationColors = d3.scaleQuantize(seqColors)
export const observationColorsDesat = d3.scaleQuantize(seqColors.map(d => {
    return desatAndLighten(d3.color(d).formatHex(), 0.3, 0.7)
}));


// -----------------
// Drawing on canvas
// -----------------

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
function drawPoints({
    ctx,
    data,
    coloringAttribute,
    saturated = true,
}) {
    for (const d of data) {
        if (coloringAttribute === "density") {
            ctx.fillStyle = saturated
                ? densityColors(d[coloringAttribute])
                : densityColorsDesat(d[coloringAttribute]);
        }
        else if (coloringAttribute === "observation") {
            ctx.fillStyle = saturated
                ? observationColors(d[coloringAttribute])
                : observationColorsDesat(d[coloringAttribute]);
        }
        else {
            ctx.fillStyle = saturated
                ? catColors(d[coloringAttribute])
                : catColorsDesat(d[coloringAttribute]);
        }

        drawCircle(ctx, d.x, d.y, 3);
        ctx.fill();
    }
}

export function drawPCA(ctxObj, data, selectedIds = null, coloringAttribute) {

    const ctx = ctxObj.ctx
    const width = ctxObj.width
    const height = ctxObj.height

    ctx.clearRect(0, 0, width, height);

    const hasSelection = selectedIds && selectedIds.size > 0;

    // Sort data for drawing points in an orderly manner
    let canvasData = data;
    if (coloringAttribute === 'density') {
        canvasData = dataSortedByDensity;
    }
    else if(coloringAttribute === 'observation') {
        canvasData = dataSortedByObservation;
    }

    if (!hasSelection) {
        drawPoints({ ctx, data: canvasData, coloringAttribute, saturated: true});
        return;
    }

    // Draw unselected (bottom)
    drawPoints({
        ctx,
        data: canvasData.filter(d => !selectedIds.has(d.id)),
        coloringAttribute,
        saturated: false,
    });

    // Draw selected (top)
    drawPoints({
        ctx,
        data: canvasData.filter(d => selectedIds.has(d.id)),
        coloringAttribute,
        saturated: true,
    });
}