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

const n = 50;
export const seqColors = Array.from({ length: n }, (_, i) => 
  // d3.interpolateCividis(i / (n - 1))
  // d3.interpolatePuBu(i / (n - 1))
  // d3.interpolateBlues(i / (n - 1))
  d3.interpolateInferno(i / (n - 1))
  // d3.interpolateViridis(i / (n - 1))
);

// build array of Desaturated colors
export const seqColorsDesat = seqColors.map((color) => desatAndLighten(color, 0.3, 0.7));

export const densityColors = d3.scaleSequential([0, 1], d3.interpolateInferno)
export const densityColorsDesat = d3.scaleSequential([0, 1], d => 
    desatAndLighten(d3.color(d3.interpolateInferno(d)).formatHex(), 0.3, 0.7)
)

export function drawSeqLegends(svg, xPos, yPos, labels, colorScale) {

    const colorStep = 1 / labels.length;
    const rectWidth = 20;
    const rectHeight = 20;

    // Remove legends of "categorical" scatterplots
    svg.selectAll('.legendDecor').remove()
    svg.selectAll('.legendLabel').remove()

    svg.selectAll(".legendDensityDecor")
        .data(labels)
        .enter()
        .append("rect")
        .attr("x", xPos)
        .attr("y", (_ , i) => yPos + i*rectHeight)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .style("fill", (_, i) => colorScale(i*colorStep))
        .attr("class", "legendDensityDecor");

    svg.selectAll(".legendDensityLabel")
        .data(labels)
        .enter()
        .append("text")
        .attr("x", xPos + rectWidth + 8)
        .attr("y", (_, i) => yPos - 4 + (i + 1)*rectHeight)
        .style("fill", "black")
        .text(d => d)
        .attr("text-anchor", "left")
        .attr("class", "legendDensityLabel");
}

export function drawLegends(svg, xPos, yPos, labels, colorScale) {

    console.log(`Add labels for: ${labels}`)
    const circleRadius = 5;

    // Remove legends of density scatterplot
    svg.selectAll('.legendDensityDecor').remove()
    svg.selectAll('.legendDensityLabel').remove()

    svg.selectAll(".legendDecor")
        .data(labels)
        .join(
            enter => enter
                .append("circle")
                .attr("cx", xPos)
                .attr("cy", (_ , i) => yPos + i*20)
                .attr("r", circleRadius)
                .style("fill", (_, i) => colorScale(i))
                .attr("class", "legendDecor"),
            update => update
                .style("fill", (_, i) => colorScale(i)),
            exit => exit.remove(),
        );

    svg.selectAll(".legendLabel")
        .data(labels)
        .join(
            enter => enter
                .append("text")
                .attr("x", xPos + circleRadius + 8)
                .attr("y", (_, i) => yPos + i*20 + circleRadius)
                .style("fill", "black")
                .text(d => d)
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .attr("class", "legendLabel"),
            update => update
                .text(d => d),
            exit => exit.remove(),
        )
}

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

        densityMatrix[xBin][yBin]++;
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
            // const densityValue = d.density; // [0,1]
            const idx = densityToIndex(d.density, seqColors.length);
            ctx.fillStyle = saturated
                ? seqColors[idx]
                : seqColorsDesat[idx];
        } else {
            ctx.fillStyle = saturated
                ? catColors(d[coloringAttribute])
                : catColorsDesat(d[coloringAttribute]);
        }

        drawCircle(ctx, d.x, d.y, 3);
        ctx.fill();
    }
}

function densityToIndex(density, n) {
  return Math.min(n - 1, Math.floor(density * n));
}