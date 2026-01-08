import * as d3 from "d3";

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


export function attachDensityIndex(data, quantizeX, quantizeY) {

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

export function drawCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draws a scatterplot on the specified canvas context using the given data.
 * Uses different colors for every value in coloringAttribute.
 * Requires data to have an attribute named `x` and `y`.
 **/
export function drawPoints({
    ctx,
    data,
    coloringAttribute,
    saturated = true,
    mode = "categorical" // or "density"
}) {
    for (const d of data) {
        if (mode === "density") {
            ctx.fillStyle = saturated
                ? densityColors(d[coloringAttribute])
                : densityColorsDesat(d[coloringAttribute]);
        } else {
            ctx.fillStyle = saturated
                ? catColors(d[coloringAttribute])
                : catColorsDesat(d[coloringAttribute]);
        }

        drawCircle(ctx, d.x, d.y, 3);
        ctx.fill();
    }
}