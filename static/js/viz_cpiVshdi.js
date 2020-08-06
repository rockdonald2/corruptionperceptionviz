(function (viz) {
    'use strict';

    const chartContainer = d3.select('#cpiVshdi .chart');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 150,
        'left': 0,
        'right': 0,
        'bottom': 0
    };
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', height).attr('transform', 'translate(0, ' + (margin.top + margin.bottom) + ')');

    let currentYear = 2018;
    let data;

    const path = d3.geoPath().projection(d3.geoNaturalEarth1().center([20, 15])
        .scale(190));

    const colors = [
        "#e8e8e8", "#e4acac", "#c85a5a",
        "#b0d5df", "#ad9ea5", "#985356",
        "#64acbe", "#627f8c", "#574249"
    ];

    let scaleX = d3.scaleQuantize();
    let scaleY = d3.scaleQuantize();
    const colorScale = function (value) {
        if (!value) return "#ddd";
        let [a, b] = value;
        return colors[scaleY(b) + scaleX(a) * n];
    }

    const n = Math.floor(Math.sqrt(colors.length));

    function zoomed() {
        const countries = d3.select('.countries');
        const lands = d3.select('.lands');

        const {
            transform
        } = d3.event;

        countries.attr("transform", transform);
        countries.attr("stroke-width", 1 / transform.k);
        lands.attr("transform", transform);
        lands.attr("stroke-width", 1 / transform.k);
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 6])
        .on("zoom", zoomed);

    const tooltip = chartContainer.select('.tooltip').style('border', 'none');;

    viz.initcpiVshdi = function () {
        const makeLegend = function () {
            const legend = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
                .attr('height', margin.top).attr('transform', 'translate(0, ' + (-height) + ')')
                .append('g').attr('class', 'legend')
                .attr('transform', 'translate(' + (width * 0.83) + ', ' + 36 + ')');

            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    legend.append('rect').attr('height', 24).attr('width', 24)
                        .attr('x', i * 24).attr('y', 48 - j * 24).style('fill', colors[j + i * n])
                }
            }

            legend.append('line').attr('marker-end', 'url(#marker)').attr('x1', 0).attr('x2', 75)
                .attr('y1', 72).attr('y2', 72).attr('stroke', '#666')
                .style('stroke-width', 1.5);
            legend.append('line').attr('marker-end', 'url(#marker)').attr('x1', 0).attr('x2', 0)
                .attr('y1', 72).attr('y2', 0).attr('stroke', '#666')
                .style('stroke-width', 1.5);
            legend.append('text').text('CPI').attr('transform', 'translate(50, 90)').style('font-size', '1.2rem');
            legend.append('text').text('HDI').attr('transform', 'translate(-10, 20) rotate(-90)').style('font-size', '1.2rem');
            legend.append('text').text('low').attr('transform', 'translate(-15, 72) rotate(45)');
            legend.append('text').text('high').attr('transform', 'translate(72, -10) rotate(45)');

            legend.append('text').text('Zoom on the map for a closer look')
                .attr('transform', 'translate(' + (-width * 0.8) + ', ' + (margin.top - 100) + ')')
                .style('font-size', '1.2rem');
            legend.append('text').text('Hover over a country for country specific information')
                .attr('transform', 'translate(' + (-width * 0.8) + ', ' + (margin.top - 72) + ')')
                .style('font-size', '1.2rem');

            const sliderTime = d3.sliderBottom()
                .min(2012).max(2018).step(1).width(300).tickFormat(d3.format('d')).tickValues(d3.range(2012, 2019))
                .default(2018).on('onchange', function (v) {
                    currentYear = v;
                    viz.updatecpiVshdi(viz.makeDataCpiVsHdi(currentYear));
                });

            legend.append('g').attr('transform', 'translate(' + (-width * 0.43) + ', ' + (margin.top - 105) + ')').call(sliderTime)
                .call(function (g) {
                    g.selectAll('text').style('font-size', '1.2rem').style('font-family', 'Encode Sans Condensed, Sans Serif');
                });
        }

        makeLegend();
        data = viz.makeDataCpiVsHdi(currentYear);

        const land = svg.append('g').attr('class', 'lands')
            .selectAll('.land')
            .data(topojson.feature(viz.data.map, viz.data.map.objects.land).features)
            .enter().append('path').attr('class', 'land').attr('d', path).attr('fill', '#ddd').attr('stroke', '#fff');

        svg.append('g').attr('class', 'countries');

        viz.updatecpiVshdi(data);

        svg.call(zoom);
    }

    viz.updatecpiVshdi = function (data) {
        scaleX.domain(d3.extent(data, function (m) {
            return m.cpi;
        })).range(d3.range(n));
        scaleY.domain(d3.extent(data, function (m) {
            return m.hdi;
        })).range(d3.range(n));

        const countries = svg.select('.countries')
            .selectAll('.country')
            .data(data, function (d) {
                return d.code;
            });

        countries.enter().append('path').attr('class', 'country').attr('d', function (d) {
                if (d.geo.properties.name == 'Antarctica') return;

                return path(d.geo);
            }).attr('id', function (d) {
                return d.code;
            })
            .attr('fill', '#ddd')
            .merge(countries)
            .style('cursor', 'pointer')
            .attr('stroke', '#fff')
            .on('mousemove', function (d) {
                d3.select(this).style('opacity', .75);

                tooltip.select('.tooltip--heading').html(d.country);
                tooltip.select('.tooltip--info').html(
                    '<p>CPI Score ' + d.cpi + '</p><p>HDI Score ' + d.hdi + '</p>'
                );

                const mouseCoords = d3.mouse(chartContainer.node());

                if (mouseCoords[0] > width * 0.75) {
                    tooltip.style('left', (mouseCoords[0] - parseInt(tooltip.style('width')) - 10) + 'px');
                } else {
                    tooltip.style('left', (mouseCoords[0] + 10) + 'px');
                }

                tooltip.style('top', (mouseCoords[1] + 10) + 'px');
            })
            .on('mouseout', function (d) {
                d3.select(this).style('opacity', 1);
                tooltip.style('left', '-9999px');
            })
            .transition().duration(viz.TRANS_DURATION)
            .attr('fill', function (d) {
                return colorScale([d.cpi, d.hdi]);
            });

        countries.exit().remove();
    }
}(window.viz = window.viz || {}));