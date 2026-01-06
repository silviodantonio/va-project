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

export function drawLegends(svg, xPos, yPos, labels, colorScale) {

    console.log(`Add labels for: ${labels}`)
    const circleRadius = 5;

    svg.selectAll(".legendDot")
        .data(labels)
        .join(
            enter => enter
                .append("circle")
                .attr("cx", xPos)
                .attr("cy", (_ , i) => yPos + i*20)
                .attr("r", circleRadius)
                .style("fill", (_, i) => colorScale(i))
                .attr("class", "legendDot"),
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
                .style("alignment-baseline", "center")
                .attr("class", "legendLabel"),
            update => update
                .text(d => d),
            exit => exit.remove(),
        )
}

export function initializeDensityScatter(data, quantizeX, quantizeY) {

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

    /* -------------------------
       Build density matrix
    ------------------------- */
    for (const d of data) {
        const xBin = Math.floor((d.x_pca - xMin) / binSizeX);
        const yBin = Math.floor((d.y_pca - yMin) / binSizeY);

        densityMatrix[xBin][yBin]++;
    }

    /* -------------------------
       Annotate points
    ------------------------- */
    for (const d of data) {
        d.xBin = Math.floor((d.x_pca - xMin) / binSizeX);
        d.yBin = Math.floor((d.y_pca - yMin) / binSizeY);

        d.density = densityMatrix[d.xBin][d.yBin];
    }

    /* -------------------------
       Color matrix
    ------------------------- */
    const maxDensity = d3.max(densityMatrix.flat());

    const densityToClass = d3.scaleQuantize()
        .domain([0, maxDensity])
        .range(d3.range(seqColors.length));

    const colorMatrix = densityMatrix.map(row =>
        row.map(d => densityToClass(d))
    );

    /* -------------------------
       Return everything needed
    ------------------------- */
    return {
        colorMatrix,
        binning: {
            xMin,
            yMin,
            binSizeX,
            binSizeY,
            quantizeX,
            quantizeY
        }
    };
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
    colorMatrix,
    saturated = true,
    mode = "categorical" // or "density"
}) {
    for (const d of data) {
        if (mode === "density") {
            const cls = colorMatrix[d.xBin][d.yBin];
            ctx.fillStyle = saturated
                ? seqColors[cls]
                : seqColorsDesat[cls];
        } else {
            ctx.fillStyle = saturated
                ? catColors(d[coloringAttribute])
                : catColorsDesat(d[coloringAttribute]);
        }

        drawCircle(ctx, d.x, d.y, 3);
        ctx.fill();
    }
}