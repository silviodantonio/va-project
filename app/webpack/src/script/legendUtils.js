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
    const midVal = (maxVal === 1 ? (maxVal + minVal) / 2 : Math.trunc((maxVal + minVal) / 2));
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
    svg.selectAll(".legendSeqDecorator")
        .data(labels)
        .join(
          enter => enter
            .append("rect")
            .attr("x", xPos)
            .attr("y", (_ , i) => yPos + (steps-1)*rectHeight - i*rectHeight)
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .style("fill", (_, i) => colorScale(minVal + i*colorStep))
            .attr("class", "legendSeqDecorator"),
          update => update,
          exit => exit,
        )

    // Draw text labels
    svg.selectAll(".legendSeqLabel")
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
            .attr("class", "legendSeqLabel"),
          update => update
            .text(d => d),
          exit => exit
        )
}

export function drawPcaDensityLegends(svg, xPos, yPos, minVal, maxVal, steps, colorScale) {

    // Remove legends of "categorical" scatterplots
    svg.selectAll('.legendCatDecorator').remove()
    svg.selectAll('.legendCatLabel').remove()
    svg.selectAll('.legendCatClickBox').remove()

    drawSeqLegends(svg, xPos, yPos, minVal, maxVal, steps, colorScale);

}

export function drawCatLegends(svg, xPos, yPos, labels, colorScale) {

    // Decorator cicle
    const circleRadius = 4;

	const fontSize = 12;
	// Space between label and decorator
	const labelOffset = 4;

    const maxLabelLen = d3.max(labels, d => d.length);
    const clicBoxWidth = (fontSize*0.6) * maxLabelLen;

    // Remove legends of density scatterplot
    svg.selectAll('.legendSeqDecorator').remove()
    svg.selectAll('.legendSeqLabel').remove()

    svg.selectAll(".legendCatDecorator")
        .data(labels)
        .join(
            enter => enter
                .append("circle")
                .attr("cx", xPos)
                .attr("cy", (_ , i) => yPos + i*20)
                .attr("r", circleRadius)
                .style("fill", (_, i) => colorScale(i))
                .attr("class", "legendCatDecorator"),
            update => update
                .style("fill", (_, i) => colorScale(i)),
            exit => exit.remove(),
        );


    svg.selectAll(".legendCatLabel")
        .data(labels)
        .join(
            enter => enter
                .append("text")
                .attr("x", xPos + circleRadius + labelOffset)
                .attr("y", (_, i) => yPos + i*20 + 1.5)
                .style("fill", "black")
                .attr('font-size', `${fontSize}px`)
                .text(d => d)
                .attr("text-anchor", "left")
                .style("dominant-baseline", "middle")
                .attr("class", "legendCatLabel"),
            update => update
                .text(d => d),
            exit => exit.remove(),
        )

    svg.selectAll(".legendCatClickBox")
        .data(labels)
        .join(
            enter => enter
                .append("rect")
                .attr("x", xPos - circleRadius)
                .attr("y", (_, i) => yPos + i*20 - (2*circleRadius))
                .attr("height", fontSize + 5)
                .attr("width", clicBoxWidth)
                .style("fill", "blue")
                .style("opacity", 0.5)
                .attr("class", "legendCatClickBox"),
            update => update
                .attr("width", clicBoxWidth),
            exit => exit.remove(),
        )

    svg.selectAll('.legendCatClickBox')
        .on('click', e => legendClicked(e));
}

function legendClicked(e) {
    console.log(`Clicked on legend`);
}