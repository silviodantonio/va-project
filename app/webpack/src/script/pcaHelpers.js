import * as d3 from "d3";

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

export const catColors = [
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

const n = 50;
export const seqColors = Array.from({ length: n }, (_, i) => 
  // d3.interpolateCividis(i / (n - 1))
  // d3.interpolatePuBu(i / (n - 1))
  // d3.interpolateBlues(i / (n - 1))
  d3.interpolateInferno(i / (n - 1))
  // d3.interpolateViridis(i / (n - 1))
);

function desatAndLightenSeq(color, desaturate, lighten) {
  const hcl = d3.hcl(color);
  hcl.c *= desaturate;
  // hcl.l += (100 - hcl.l) * lighten;
  const adjustedLight = hcl.l + (100 - hcl.l) * lighten * (1 - hcl.l / 100);
  hcl.l = Math.min(100, adjustedLight);
  return hcl.formatHex();
}

// build array of Desaturated colors
export const catColorsDesat = catColors.map((color) => desatAndLighten(color, 0.3, 0.7));
export const seqColorsDesat = seqColors.map((color) => desatAndLightenSeq(color, 0.3, 0.7));

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
export function drawBaseCanvas(ctx, data, coloringAttribute) {

    // Draw new content
    for (const d of data) {
        ctx.fillStyle = catColors[d[coloringAttribute]];
        drawCircle(ctx, d.x, d.y, 3);
        ctx.fill();
    }

    console.log('New canvas drawn');
}

export function drawDensityScatter(ctx, data, colorMatrix, desaturated = false) {

    const palette = desaturated ? seqColorsDesat : seqColors;

    for (const d of data) {
            const cls = colorMatrix[d.xBin][d.yBin];
            ctx.fillStyle = palette[cls];
            drawCircle(ctx, d.x, d.y, 3);
            ctx.fill();
    }
}