import * as d3 from "d3";

export function drawSeqLegends(svg, xPos, yPos, minVal, maxVal, steps, colorScale) {

	// Variables that manage the styling
    const rectWidth = 12;
    const rectHeight = 12;

	const fontSize = 10;
	// Space between label and decorator
	const labelOffset = 4;

    // Build array for labels.
    // It will contain only labels for min, max and middle value.
    const labels = new Array(steps).fill('');
    labels[0] = minVal;
    labels[steps - 1] = maxVal
    const midVal = Math.trunc((maxVal + minVal) / 2);
    labels[Math.trunc(steps / 2)] = midVal;

	// Shorten labels
	for (let i = 0; i < labels.length; i++) {
		if (labels[i] > 1000) {
			labels[i] = labels[i] / 1000;
			labels[i] = `${Math.round(labels[i])}K`;
		}
	}

    const colorStep = (maxVal - minVal) / steps;

    // Draw squares for color scale
    svg.selectAll(".legendDecorator")
        .data(labels)
        .join(
          enter => enter
            .append("rect")
            .attr("x", xPos)
            .attr("y", (_ , i) => yPos + (steps-1)*rectHeight - i*rectHeight)
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .style("fill", (_, i) => colorScale(minVal + i*colorStep))
            .attr("class", "legendDecorator"),
          update => update,
          exit => exit,
        )

    // Draw text labels
    svg.selectAll(".legendLabel")
        .data(labels)
        .join(
          enter => enter
            .append("text")
            .attr("x", xPos + rectWidth + labelOffset)
            .attr("y", (_, i) => yPos + (rectHeight/2) + (steps-1)*rectHeight + 2 - i*rectHeight)
            .attr('dominant-baseline', "middle")
            .style("fill", "black")
			.style("font-size", `${fontSize}px`)
            .text(d => d)
            .attr("class", "legendLabel"),
          update => update
            .text(d => d),
          exit => exit
        )
}

export function drawPcaDensityLegends(svg, xPos, yPos, minVal, maxVal, steps, colorScale) {

	// Variables that manage the styling
    const rectWidth = 15;
    const rectHeight = 15;

	const fontSize = 15;
	// Space between label and decorator
	const labelOffset = 6;

    // Build array for labels.
    // It will contain only labels for min, max and middle value.
    const labels = new Array(steps).fill('');
    labels[0] = minVal;
    labels[steps - 1] = maxVal
    const midVal = (maxVal + minVal) / 2;
    labels[Math.trunc(steps / 2)] = midVal;

    const colorStep = (maxVal - minVal) / steps;

    // Remove legends of "categorical" scatterplots
    svg.selectAll('.legendDecor').remove()
    svg.selectAll('.legendLabel').remove()

    svg.selectAll(".legendDensityDecor")
        .data(labels)
        .enter()
        .append("rect")
        .attr("x", xPos)
        .attr("y", (_ , i) => yPos + (labels.length-1)*rectHeight - i*rectHeight)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .style("fill", (_, i) => colorScale(i*colorStep))
        .attr("class", "legendDensityDecor");

    svg.selectAll(".legendDensityLabel")
        .data(labels)
        .enter()
        .append("text")
        .attr("x", xPos + rectWidth + labelOffset)
        .attr("y", (_, i) => yPos + (rectHeight/2) + (labels.length-1)*rectHeight + 2 - i*rectHeight)
        .attr('dominant-baseline', "middle")
        .style("fill", "black")
		.style("font-size", `${fontSize}px`)
        .text(d => d)
        .attr("class", "legendDensityLabel");
}

export function drawCatLegends(svg, xPos, yPos, labels, colorScale) {

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
                .attr("y", (_, i) => yPos + i*20)
                .style("fill", "black")
                .text(d => d)
                .attr("text-anchor", "left")
                .style("dominant-baseline", "middle")
                .attr("class", "legendLabel"),
            update => update
                .text(d => d),
            exit => exit.remove(),
        )
}