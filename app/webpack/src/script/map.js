import * as d3 from 'd3';
import * as topojson from "topojson-client";

export default function main() {
    const container = document.getElementById('container');
    const title = document.getElementById('title');
    title.innerHTML = 'Incidenti stradali - dettaglio regionale';

    Promise.all([
        fetch("http://127.0.0.1:7000/limits_IT_regions.topo.json").then(res => res.json()),
        fetch("http://127.0.0.1:7000/accidents_region.csv").then(res => res.text())
    ])
    .then(([itJson, csvText]) => {
        const it = itJson;
        const accidents = d3.csvParse(csvText);

        const valuemap = d3.rollup(
            accidents,
            v => d3.sum(v, d => +d.observations),
            d => d.area_desc
        );

        const values = Array.from(valuemap.values()).filter(v => v != null);
        const nSteps = 9;
        const color = d3.scaleQuantile()
            .domain(values)
            .range(d3.schemePuBu[nSteps]);

        const regions = topojson.feature(it, it.objects.regions);
        const width = 975;
        const height = 700;
        const mapCenter = [width/2, height/2];

        const projection = d3.geoMercator()
            .fitSize([width, height], regions);
        const path = d3.geoPath(projection);

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Mesh under regions
        svg.append("path")
            .datum(topojson.mesh(it, it.objects.regions, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", path);

        // Legend (same as before)
        const legendWidth = 300;
        const legendHeight = 20;
        const boxWidth = legendWidth / nSteps;
        const legendG = svg.append("g")
            .attr("transform", `translate(${width - legendWidth - 20},20)`);
        color.range().forEach((c, i) => {
            legendG.append("rect")
                .attr("x", i*boxWidth)
                .attr("y",0)
                .attr("width", boxWidth)
                .attr("height", legendHeight)
                .attr("stroke", "black")
                .attr("fill", c);
        });
        const quantiles = color.quantiles();
        const tickValues = [0, ...quantiles, d3.max(values)];
        tickValues.forEach((t,i)=>{
            legendG.append("text")
                .attr("x", i*boxWidth)
                .attr("y", legendHeight+15)
                .attr("text-anchor","middle")
                .text(d3.format(".2s")(t));
        });
        legendG.append("text")
            .attr("x", legendWidth/2)
            .attr("y",-6)
            .attr("text-anchor","middle")
            .attr("font-weight","bold")
            .text("Numero di incidenti");

        const baseG = svg.append("g").attr("class","base");

        // Hover overlay group: line + rect + text
        const hoverOverlay = svg.append("g")
            .attr("class","hover-overlay")
            .style("pointer-events","none")
            .style("visibility","hidden");

        const overlayLine = hoverOverlay.append("line")
            .attr("stroke","black")
            .attr("stroke-width",1);

        const overlayRect = hoverOverlay.append("rect")
            .attr("rx",4).attr("ry",4)
            .attr("stroke","black")
            .attr("stroke-width",1);

        const overlayText = hoverOverlay.append("text")
            .attr("text-anchor","middle")
            .attr("font-weight","bold")
            .attr("font-size",16);

        // Draw regions
        baseG.selectAll("path")
            .data(regions.features)
            .join("path")
            .attr("fill", d=>{
                const v = valuemap.get(d.properties.reg_name);
                return v != null ? color(v) : "#eee";
            })
            .attr("stroke","black")
            .attr("stroke-width",1)
            .attr("d", path);

        baseG.selectAll("path")
            .on("mouseenter", function(event,d){
                const v = valuemap.get(d.properties.reg_name);
                if(v==null) return;

                const [cx, cy] = path.centroid(d);

                // Enlarge region
                d3.select(this)
                    .raise()
                    .transition().duration(100)
                    .attr("transform", `translate(${cx},${cy}) scale(1.15) translate(${-cx},${-cy})`)
                    .attr("stroke","LightSalmon")
                    .attr("stroke-width",3);
            })
            .on("mousemove", function(event,d){
                const v = valuemap.get(d.properties.reg_name);
                if(v==null) return;

                const [cx, cy] = d3.pointer(event, svg.node());

                // Overlay position along vector from region centroid to map center
                const [rx, ry] = path.centroid(d);
                const dx = mapCenter[0]-rx;
                const dy = mapCenter[1]-ry;
                const length = Math.sqrt(dx*dx+dy*dy);
                const offset = 60;
                const ux = dx/length;
                const uy = dy/length;
                let overlayX = cx + ux*offset;
                let overlayY = cy + uy*offset;

                // Clamp overlay inside viewport
                overlayX = Math.max(30, Math.min(width-30, overlayX));
                overlayY = Math.max(30, Math.min(height-30, overlayY));

                // Overlay line
                overlayLine
                    .attr("x1", cx)
                    .attr("y1", cy)
                    .attr("x2", overlayX)
                    .attr("y2", overlayY);

                // Text color based on region fill brightness
                const rgb = d3.color(color(v));
                const brightness = 0.299*rgb.r + 0.587*rgb.g + 0.114*rgb.b;
                const textColor = brightness<140 ? "white":"black";

                // Overlay text: two lines
                overlayText.selectAll("*").remove();
                overlayText.append("tspan")
                    .attr("x",overlayX).attr("y",overlayY-7)
                    .text(d.properties.reg_name)
                    .attr("fill", textColor);
                overlayText.append("tspan")
                    .attr("x",overlayX).attr("y",overlayY+14)
                    .text(v)
                    .attr("fill", textColor);

                // Overlay rectangle
                const bbox = overlayText.node().getBBox();
                overlayRect
                    .attr("x",bbox.x-4)
                    .attr("y",bbox.y-2)
                    .attr("width",bbox.width+8)
                    .attr("height",bbox.height+4)
                    .attr("fill", color(v));

                hoverOverlay.style("visibility","visible");
            })
            .on("mouseleave", function(event,d){
                d3.select(this)
                    .transition().duration(100)
                    .attr("transform","translate(0,0)")
                    .attr("stroke","black")
                    .attr("stroke-width",1);

                hoverOverlay.style("visibility","hidden");
            });

        container.append(svg.node());
    })
    .catch(err => console.error(err));
}
