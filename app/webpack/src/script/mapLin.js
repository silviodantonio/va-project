import * as d3 from 'd3';
import * as topojson from "topojson-client";
import { REGION_LIST } from './constants.js';
import { selectionStore, updateSelection, computeActiveSelection } from "./selectionStore.js";

export default function main() {
    const container = document.getElementById('map-container');
    // const title = document.getElementById('title');
    // title.innerHTML = 'Incidenti stradali - dettaglio regionale';

        
    // Get container dimensions first
    const containerWidth = container.clientWidth - 20;
    const containerHeight = container.clientHeight;
    

    // const region_list=["Piemonte", "Valle d'Aosta / Vallée d'Aoste", "Liguria", "Lombardia", "Trentino Alto Adige / Südtirol", "Veneto", "Friuli-Venezia Giulia", "Emilia-Romagna", "Toscana", "Umbria", "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"];

    Promise.all([
        fetch("http://127.0.0.1:7000/limits_IT_regions_cut.topo.json").then(res => res.json()),
        fetch("http://127.0.0.1:7000/accidents_regions_complete.csv").then(res => res.text())
    ])
    .then(([itJson, csvText]) => {
        const it = itJson;
        const accidents = d3.csvParse(csvText);

        // assign global sequential id
        accidents.forEach((d, i) => {
            d.__id = i;
        });

        // Rollup sum of accidents per region
        function computeValueMap(data) {
            return d3.rollup(
                data,
                v => d3.sum(v, d => +d.observation),
                d => REGION_LIST[+d.region - 1]
            );
        }

        let activeData = accidents;
        let valuemap = computeValueMap(activeData);

        const nSteps = 9;
        let color = d3.scaleQuantize()
            .range(d3.schemeBlues[nSteps]);

        function updateColorScale(valuemap) {
            const values = Array.from(valuemap.values()).filter(v => v != null);
            const maxValue = values.length ? d3.max(values) : 0;
            color.domain([0, maxValue]);
            return maxValue;
        }

        let maxValue = updateColorScale(valuemap);
        const regions = topojson.feature(it, it.objects.regions);

        // Use container dimensions instead of fixed values
        const legendBlockHeight = 70;
        const width = containerWidth;
        const height = containerHeight - legendBlockHeight;
        const mapCenter = [width / 2, height / 2];
        const legendFontSize = width / 25; // adjust divisor to taste

        const mapPadding = 20; // safe buffer
        const projection = d3.geoMercator()
            .fitExtent([[mapPadding, mapPadding], [width - mapPadding, height - mapPadding]], regions);

        const path = d3.geoPath(projection);

        // Create SVG that fills the container
        const svg = d3.create("svg")
            .attr("viewBox", `0 0 ${width} ${height + legendBlockHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow", "visible");

        const legendLayer = svg.append("g");
        const mapLayer = svg.append("g")
            .attr("transform", `translate(0, ${legendBlockHeight})`);

        /* ------------------ MESH (UNDER REGIONS) ------------------ */
        mapLayer.append("path")
            .datum(topojson.mesh(it, it.objects.regions, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("pointer-events", "none")
            .attr("d", path);

        /* ------------------ LEGEND ------------------ */
        const legendWidth = Math.min(width * 0.8, 420);
        // const legendHeight = 20;
        const legendHeight = Math.min(height * 0.025, 20);
        const boxWidth = legendWidth / nSteps;

        const legendG = legendLayer.append("g")
            // .attr("transform", `translate(${(width - legendWidth)/2}, ${height * 0.15 - legendHeight*2})`);
            .attr("transform", `translate(${(width - legendWidth)/2}, ${legendHeight*2})`);


        function updateLegend(maxValue) {
            legendG.selectAll("*").remove();

            color.range().forEach((c, i) => {
                legendG.append("rect")
                    .attr("x", i * boxWidth)
                    .attr("y", 10)
                    .attr("width", boxWidth)
                    .attr("height", legendHeight)
                    .attr("stroke", "black")
                    .attr("fill", c);
            });

            const tickValues = d3.range(nSteps + 1)
                .map(i => i * maxValue / nSteps);

            tickValues.forEach((t, i) => {
                legendG.append("text")
                    .attr("x", i * boxWidth)
                    .attr("y", legendHeight + legendFontSize + 10)
                    .attr("text-anchor", "middle")
                    .attr("font-size", legendFontSize * 0.8)
                    .text(d3.format(".2s")(t));
            });

            legendG.append("text")
                .attr("x", legendWidth / 2)
                .attr("y", -6)
                .attr("text-anchor", "middle")
                .attr("font-weight", "bold")
                .attr("font-size", legendFontSize)
                .text("Numero di incidenti");
        }

        updateLegend(maxValue);

        /* ------------------ MAP LAYERS ------------------ */
        const baseG = mapLayer.append("g")
            .attr("class", "base")
        
        const clippedG = baseG.append("g")
            .attr("clip-path", "url(#map-clip)");

        const hoverOverlay = mapLayer.append("g")
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

        svg.append("defs")
            .append("clipPath")
            .attr("id", "map-clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        /* ------------------ REGIONS ------------------ */

        mapLayer.insert("rect", ":first-child")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")   // invisible but captures clicks
            .on("click", function () {

                if (selectionStore.pca != null) {
                    document.dispatchEvent(new CustomEvent("clear-pca-brush"));
                }

                clippedG.selectAll("path")
                    .classed("clicked-region", false)
                    .attr("transform", "translate(0,0)")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

                updateSelection("region", null);
            });

        clippedG.selectAll("path")
            .data(regions.features)
            .join("path")
            .style('cursor', 'pointer')
            .attr("fill", d => {
                const v = valuemap.get(d.properties.reg_name) ?? 0;
                return color(v);

            })
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", path)
            .on("mouseenter", function(event, d) {
                const v = valuemap.get(d.properties.reg_name) ?? 0;
                
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
                const v = valuemap.get(d.properties.reg_name) ?? 0;

                const [mx, myRaw] = d3.pointer(event, svg.node());
                const my = myRaw - legendBlockHeight;
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
            .on("mouseleave", function () {
                const sel = d3.select(this);

                // If this region is selected, only reset transform
                if (sel.classed("clicked-region")) {
                    sel.transition().duration(100)
                    .attr("transform", "translate(0,0)");
                } else {
                    // Reset hover styling for non-selected regions
                    sel.transition().duration(100)
                    .attr("transform", "translate(0,0)")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
                }

                // Re-raise the selected region (if any)
                const selected = clippedG.select("path.clicked-region");
                if (!selected.empty()) {
                    selected.raise();
                }

                hoverOverlay.style("visibility", "hidden");
            })
            .on("click", function (event, d) {
                event.stopPropagation();

                d3.select(this)
                    .raise();

                if (selectionStore.pca != null) {
                    document.dispatchEvent(new CustomEvent("clear-pca-brush"));
                }

                const regionName = d.properties.reg_name;

                const selectedIDs = new Set(
                    accidents
                        .filter(a => REGION_LIST[+a.region - 1] === regionName)
                        .map(a => a.__id)
                );

                // updateSelection("region", { region: regionName, ids: selectedIDs });
                const current = selectionStore.region;
                const same = current && current.region === regionName && current.ids.size === selectedIDs.size && [...selectedIDs].every(id => current.ids.has(id));
                updateSelection("region", same ? null : { region: regionName, ids: selectedIDs });

                document.dispatchEvent(new CustomEvent("selection-changed", {
                    detail: { source: "region", store: selectionStore }
                }));

            });

        container.append(svg.node());

        document.addEventListener("selection-changed", () => {
            if (!clippedG) return; // map not ready yet

            const activeIDs = computeActiveSelection(selectionStore);

            activeData = activeIDs
                ? accidents.filter(d => activeIDs.has(d.__id))
                : accidents;

            valuemap = computeValueMap(activeData);
            const maxValue = updateColorScale(valuemap);
            updateLegend(maxValue);

            // recolor regions
            const paths = clippedG.selectAll("path");

            // Recolor with transition
            paths.transition()
                .duration(300)
                .attr("fill", d => {
                    const v = valuemap.get(d.properties.reg_name) ?? 0;
                    return color(v);
                });

            // Update class and stroke immediately (no transition)
            paths.classed("clicked-region", d =>
                selectionStore.region?.region === d.properties.reg_name
            )
            .attr("stroke", d =>
                selectionStore.region?.region === d.properties.reg_name ? "LightSalmon" : "black"
            )
            .attr("stroke-width", d =>
                selectionStore.region?.region === d.properties.reg_name ? 3 : 1
            );
        });

    })
    .catch(err => console.error(err));
}