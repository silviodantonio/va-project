import * as d3 from 'd3';
import * as topojson from "topojson-client";

export default function main() {
    const container = document.getElementById('container');
    const title = document.getElementById('title');
    title.innerHTML = 'Incidenti stradali - dettaglio regionale';

    const region_list=["Piemonte", "Valle d'Aosta / Vallée d'Aoste", "Liguria", "Lombardia", "Trentino Alto Adige / Südtirol", "Veneto", "Friuli-Venezia Giulia", "Emilia-Romagna", "Toscana", "Umbria", "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"];

    Promise.all([
        fetch("http://127.0.0.1:7000/limits_IT_regions.topo.json").then(res => res.json()),
        fetch("http://127.0.0.1:7000/accidents_regions_complete.csv").then(res => res.text())
    ])
    .then(([itJson, csvText]) => {
        const it = itJson;
        const accidents = d3.csvParse(csvText);

        // Rollup sum of accidents per region
        const valuemap = d3.rollup(
            accidents,
            v => d3.sum(v, d => +d.observation),
            d => region_list[+d.region - 1]
        );

        const values = Array.from(valuemap.values()).filter(v => v != null);
        const maxValue = d3.max(values);

        const nSteps = 9;

        // QUANTIZE scale (linear bins)
        const color = d3.scaleQuantize()
            .domain([0, maxValue])
            .range(d3.schemeBlues[nSteps]);

        const regions = topojson.feature(it, it.objects.regions);

        const width = 975;
        const height = 700;
        const mapCenter = [width / 2, height / 2];

        const projection = d3.geoMercator()
            .fitSize([width, height], regions);

        const path = d3.geoPath(projection);

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        /* ------------------ MESH (UNDER REGIONS) ------------------ */
        svg.append("path")
            .datum(topojson.mesh(it, it.objects.regions, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", path);

        /* ------------------ LEGEND ------------------ */
        const legendWidth = 300;
        const legendHeight = 20;
        const boxWidth = legendWidth / nSteps;

        const legendG = svg.append("g")
            .attr("transform", `translate(${width - legendWidth - 20},20)`);

        color.range().forEach((c, i) => {
            legendG.append("rect")
                .attr("x", i * boxWidth)
                .attr("y", 0)
                .attr("width", boxWidth)
                .attr("height", legendHeight)
                .attr("stroke", "black")
                .attr("fill", c);
        });

        // Linear ticks
        const tickValues = d3.range(nSteps + 1)
            .map(i => 0 + i * (maxValue - 0) / nSteps);

        tickValues.forEach((t, i) => {
            legendG.append("text")
                .attr("x", i * boxWidth)
                .attr("y", legendHeight + 15)
                .attr("text-anchor", "middle")
                .text(d3.format(".2s")(t));
        });

        legendG.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -6)
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .text("Numero di incidenti");

        /* ------------------ MAP LAYERS ------------------ */
        const baseG = svg.append("g").attr("class", "base");

        const hoverOverlay = svg.append("g")
            .style("pointer-events", "none")
            .style("visibility", "hidden");

        const overlayLine = hoverOverlay.append("line")
            .attr("stroke", "black");

        const overlayRect = hoverOverlay.append("rect")
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("stroke", "black");

        const overlayText = hoverOverlay.append("text")
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .attr("font-size", 16);

        /* ------------------ REGIONS ------------------ */
        baseG.selectAll("path")
            .data(regions.features)
            .join("path")
            .attr("fill", d => {
                const v = valuemap.get(d.properties.reg_name);
                return v != null ? color(v) : "#eee";
            })
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", path)
            .on("mouseenter", function(event, d) {
                const v = valuemap.get(d.properties.reg_name);
                if (v == null) return;
                
                const [cx, cy] = path.centroid(d);
                
                // Enlarge region
                d3.select(this)
                    .raise()
                    .transition().duration(100)
                    .attr("transform", `translate(${cx},${cy}) scale(1.15) translate(${-cx},${-cy})`)
                    .attr("stroke","LightSalmon")
                    .attr("stroke-width",3);
            })
            .on("mousemove", function(event, d) {
                const v = valuemap.get(d.properties.reg_name);
                if (v == null) return;

                const [mx, my] = d3.pointer(event, svg.node());
                const [rx, ry] = path.centroid(d);

                const dx = mapCenter[0] - rx;
                const dy = mapCenter[1] - ry;
                const len = Math.hypot(dx, dy);
                const offset = 70;

                let ox = mx + dx / len * offset;
                let oy = my + dy / len * offset;

                ox = Math.max(40, Math.min(width - 40, ox));
                oy = Math.max(40, Math.min(height - 40, oy));

                overlayLine
                    .attr("x1", mx)
                    .attr("y1", my)
                    .attr("x2", ox)
                    .attr("y2", oy);

                const rgb = d3.color(color(v));
                const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
                const textColor = brightness < 140 ? "white" : "black";

                overlayText.selectAll("*").remove();
                overlayText.append("tspan")
                    .attr("x", ox)
                    .attr("y", oy - 6)
                    .attr("fill", textColor)
                    .text(d.properties.reg_name);

                overlayText.append("tspan")
                    .attr("x", ox)
                    .attr("y", oy + 16)
                    .attr("fill", textColor)
                    .text(v);

                const bbox = overlayText.node().getBBox();
                overlayRect
                    .attr("x", bbox.x - 6)
                    .attr("y", bbox.y - 4)
                    .attr("width", bbox.width + 12)
                    .attr("height", bbox.height + 8)
                    .attr("fill", color(v));

                hoverOverlay.style("visibility", "visible");
            })
            .on("mouseleave", function() {
                d3.select(this)
                    .transition().duration(100)
                    .attr("transform","translate(0,0)")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

                hoverOverlay.style("visibility", "hidden");
            });

        container.append(svg.node());
    })
    .catch(err => console.error(err));
}