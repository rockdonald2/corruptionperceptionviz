(function (viz) {
    'use strict';

    /* alapvető változók */
    const chartContainer = d3.select('#byCountry .chart');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 200,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom);

    /* skálák */
    const scaleX = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const scaleY = d3.scaleBand().rangeRound([0, height]).paddingInner(0.1).paddingOuter(0);
    const scaleR = d3.scaleOrdinal().domain(d3.range(2012, 2020)).range(d3.range(2, 10));
    const colorScale = d3.scaleOrdinal().range(['#E74C3C', '#913D88', '#F5AB35', '#1BBC9B', '#3498DB', '#336E7B']);

    const tooltip = chartContainer.select('.tooltip');

    /* két változó, amely nyomonköveti, hogy a felhasználó épp melyik éveket választotta ki a listából */
    let clickedYears = {
        2012: false,
        2013: false,
        2014: false,
        2015: false,
        2016: false,
        2017: false,
        2018: false,
        2019: false
    };

    let activeYears = [];

    /* létrehozza az ábra keretét, a jelmagyarázatot, tengelyeket, a mousearea-t, amely követi az egér mozgását és
        a csoportot, amely tartalmazza a tényleges ábrát */
    viz.initByCountry = function () {
        scaleY.domain(Object.keys(viz.data.scores));
        colorScale.domain(Object.keys(viz.data.regions));

        /* jelmagyarázat */
        const makeLegend = function () {
            const legendWidth = 800;
            const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + (width + margin.left + margin.right - legendWidth) / 2 + ', 20)');

            const legendTicks = legend.selectAll('g').data(Object.keys(viz.data.regions).map(function (c) {
                return {
                    'code': c,
                    'region': viz.data.regions[c],
                }
            }));

            const legendGroups = legendTicks.enter().append('g').attr('class', 'legendGroup').attr('transform', function (d, i) {
                return 'translate(' + (i % 2 == 0 ? (i * 150) : (i * 150 - 150)) + ',' + (i % 2 ? 25 : 0) + ')';
            });

            legendGroups.append('circle').attr('r', scaleR(2019)).attr('stroke', function (d) {
                return colorScale(d.code);
            }).attr('stroke-width', '3px').attr('fill', 'none');
            legendGroups.append('text').text(function (d) {
                    return d.region;
                }).style('alignment-baseline', 'middle')
                .attr('x', 20)
                .style('font-size', '1.2rem')
                .attr('fill', '#666')
                .attr('dy', '.1em');

            const yearGroups = legendTicks.append('g').attr('class', 'legendYear').data(d3.range(2012, 2020))
                .enter().append('g').attr('class', 'yearGroup')
                .attr('transform', function (d, i) {
                    return 'translate(' + (i * 60 + 350) + ', 90)';
                })
                .style('cursor', 'pointer')
                .on('mousemove', function (d) {
                    d3.select(this).select('text').style('font-weight', 700).attr('fill', '#f4d03f');
                    d3.select(this).select('circle').attr('stroke', '#f4d03f');
                })
                .on('mouseout', function (d) {
                    if (!clickedYears[d]) {
                        d3.select(this).select('text').style('font-weight', null).attr('fill', null);
                        d3.select(this).select('circle').attr('stroke', '#666');
                    }
                })
                .on('click', function (d) {
                    clickedYears[d] = !clickedYears[d];

                    activeYears = Object.keys(clickedYears).filter(function (m) {
                        return clickedYears[m];
                    }).map(function (m) {
                        return parseInt(m);
                    });

                    if (activeYears.length == 0) {
                        viz.byCountryData.filter();
                    } else {
                        viz.byCountryData.filterFunction(viz.multivalue_filter(activeYears));
                    }

                    viz.updateByCountry(viz.byCountryData.top(Infinity));
                });

            yearGroups.append('circle').attr('r', function (d) {
                return scaleR(d);
            }).attr('fill', 'none').attr('stroke-width', '3px').attr('stroke', '#666');
            yearGroups.append('text').text(function (d) {
                    return d;
                }).style('alignment-baseline', 'middle')
                .attr('x', 15)
                .style('font-size', '1.2rem')
                .attr('fill', '#666')
                .attr('transform', 'rotate(-45)');

            legend.append('text').text('Click on year labels to filter data by year')
                .attr('fill', '#666')
                .attr('font-size', '1.1rem')
                .attr('transform', 'translate(-9, 80)')
                .style('alignment-baseline', 'middle');
        }

        makeLegend();

        /* tengelyek */
        const makeAxis = function () {
            const xAxisTop = svg.append('g').attr('class', 'x-axis-top').attr('transform', 'translate(' + margin.left + ',' + (margin.top - 40) + ')');
            const xTicksTop = xAxisTop.selectAll('.x-ticks').data(d3.range(scaleX.domain()[0], scaleX.domain()[1] + 1, 10))
                .enter().append('g').attr('class', 'x-ticks');

            xTicksTop.append('line').attr('x1', function (d) {
                return scaleX(d);
            }).attr('x2', function (d) {
                return scaleX(d);
            }).attr('y1', -6).attr('y2', function (d) {
                if (d == 50) return height + margin.bottom + 20;

                return 6;
            }).attr('stroke', '#666').attr('stroke-dasharray', function (d) {
                if (d == 50) return '10px';

                return null;
            });

            xTicksTop.append('text').text(function (d) {
                    return d;
                }).attr('x', function (d) {
                    return scaleX(d);
                }).style('text-anchor', 'middle')
                .attr('y', -10).style('font-size', '1.2rem').style('font-weight', 500)
                .attr('fill', '#666');

            const xAxisBottom = svg.append('g').attr('class', 'x-axis-bottom').attr('transform', 'translate(' + margin.left + ',' + (height + margin.top + 20) + ')');
            const xTicksBottom = xAxisBottom.selectAll('.x-ticks').data(d3.range(scaleX.domain()[0], scaleX.domain()[1] + 1, 10))
                .enter().append('g').attr('class', 'x-ticks');

            xTicksBottom.append('line').attr('x1', function (d) {
                return scaleX(d);
            }).attr('x2', function (d) {
                return scaleX(d);
            }).attr('y1', -6).attr('y2', function (d) {
                if (d == 50) return -6;

                return 6;
            }).attr('stroke', '#666').attr('stroke-dasharray', function (d) {
                if (d == 50) return '10px';

                return null;
            });

            xTicksBottom.append('text').text(function (d) {
                    if (d == 50) return '';

                    return d;
                }).attr('x', function (d) {
                    return scaleX(d);
                }).style('text-anchor', 'middle')
                .attr('y', -10).style('font-size', '1.2rem').style('font-weight', 500)
                .attr('fill', '#666');

            svg.append('marker').attr('id', 'marker').attr('markerHeight', 10).attr('markerWidth', 10).attr('refX', 6).attr('refY', 3).attr('orient', 'auto')
                .append('path').attr('d', 'M0,0L9,3L0,6Z').attr('fill', '#666');

            xAxisTop.append('g').attr('transform', 'translate(' + (width / 2 - 10) + ', 40)').call(function (g) {
                g.append('text').text('MORE CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em').style('text-anchor', 'end').attr('fill', '#666');
            }).call(function (g) {
                g.append('line').attr('x1', -90).attr('x2', -138).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });

            xAxisTop.append('g').attr('transform', 'translate(' + (width / 2 + 10) + ', 40)').call(function (g) {
                g.append('text').text('LESS CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em').attr('fill', '#666');
            }).call(function (g) {
                g.append('line').attr('x1', 80).attr('x2', 128).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });

            xAxisBottom.append('g').attr('transform', 'translate(' + (width / 2 - 10) + ', -40)').call(function (g) {
                g.append('text').text('MORE CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em').style('text-anchor', 'end').attr('fill', '#666');
            }).call(function (g) {
                g.append('line').attr('x1', -90).attr('x2', -138).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });

            xAxisBottom.append('g').attr('transform', 'translate(' + (width / 2 + 10) + ', -40)').call(function (g) {
                g.append('text').text('LESS CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em').attr('fill', '#666');
            }).call(function (g) {
                g.append('line').attr('x1', 80).attr('x2', 128).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });
        }

        makeAxis();

        /* egérkövető */
        const mouseArea = svg.insert('g', '.legend').attr('class', 'mouse-area').attr('transform', 'translate(' + margin.left + ', ' + (margin.top - 40) + ')')
            .call(function (g) {
                g.append('rect').attr('width', width).attr('height', height).attr('fill', 'transparent');
            })
            .call(function (g) {
                g.append('line').attr('class', 'x-line').attr('stroke', '#ddd').attr('stroke-dasharray', '.5px').transition().duration(viz.TRANS_DURATION / 5);
                g.append('text').attr('class', 'x-text');
            })
            .on('mousemove', function () {
                const g = chartContainer.select('.mouse-area');

                const mouseCoords = d3.mouse(g.node());

                g.select('.x-line').attr('opacity', 1).attr('x1', mouseCoords[0]).attr('x2', mouseCoords[0])
                    .attr('y1', height + 40).attr('y2', 0);
                g.select('.x-text').attr('opacity', 1).text(scaleX.invert(mouseCoords[0]).toFixed(0))
                    .attr('transform', 'translate(' + (mouseCoords[0] + 10) + ', ' + (mouseCoords[1]) + ')');
            })
            .on('mouseleave', function () {
                const g = chartContainer.select('.mouse-area');

                g.select('.x-line').attr('opacity', 0);
                g.select('.x-text').attr('opacity', 0);
            });

        /* ez a csoport fogja tartalmazni a tényleges ábrát */
        svg.append('g').attr('class', 'circleGroup').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        /* elindítjuk az első frissítést */
        viz.updateByCountry(viz.byCountryData.top(Infinity));
    }

    /* létrehozza a tényleges ábrát, és ez felel annak frissítéséért is */
    viz.updateByCountry = function (data) {
        const circleGroup = svg.select('.circleGroup');

        /* hozzáadjuk a köröket, és frissítjük */
        const bubbles = circleGroup.selectAll('.bubble').data(data, function (d) {
            return d.code;
        });

        bubbles.enter().append('circle').attr('class', 'bubble')
            .attr('id', function (d) {
                return d.code;
            })
            .attr('r', function (d) {
                return scaleR(d.year);
            })
            .attr('cx', 0)
            .attr('cy', function (d) {
                return scaleY(d.code);
            })
            .merge(bubbles)
            .style('cursor', 'pointer')
            .on('mousemove', function (d) {
                chartContainer.select('text#' + d.code).style('font-weight', 700).attr('opacity', 1)
                    .attr('fill', '#f4d03f');

                tooltip.select('.tooltip--heading').html(d.year);
                tooltip.select('.tooltip--info').html('<p>CPI Score ' + d.score + '</p>');

                const mouseCoords = d3.mouse(chartContainer.node());

                tooltip.style('left', (mouseCoords[0] + 10) + 'px');
                tooltip.style('top', (mouseCoords[1] + 10) + 'px');
            })
            .on('mouseout', function (d) {
                chartContainer.select('text#' + d.code).style('font-weight', 300).attr('opacity', .5)
                    .attr('fill', null);
                tooltip.style('left', '-9999px');
            })
            .transition().duration(viz.TRANS_DURATION)
            .attr('r', function (d) {
                return scaleR(d.year);
            }).attr('stroke', function (d) {
                return colorScale(d.region);
            }).attr('stroke-width', '3px')
            .attr('cy', function (d) {
                return scaleY(d.code);
            })
            .style('fill', 'transparent')
            .attr('cx', function (d) {
                return scaleX(d.score);
            });

        bubbles.exit().remove();

        /* kitöröljük a köröket összekötő vonalakat, és kisebb köröket, valamint az országcímkéket */
        circleGroup.selectAll('line').remove();
        circleGroup.selectAll('text').remove();
        circleGroup.selectAll('circle.end-point').remove();
        svg.select('g#avg').remove();

        /* hozzáadjuk a kitörölt elemeket, valamint megjelenítjük az átlagot is, ha egyetlen év van kiválasztva */
        setTimeout(function () {
            if (activeYears.length == 1) {
                const avg = d3.mean(data, function (d) {
                    return d.score;
                });

                svg.insert('g', '.legend').attr('id', 'avg')
                    .attr('transform', function () {
                        return 'translate(' + (scaleX(avg) + margin.left) + ', 175)';
                    })
                    .call(function (g) {
                        g.append('line').attr('y1', 0).attr('y2', height - margin.bottom / 2)
                            .attr('stroke', '#666')
                            .attr('opacity', .75)
                            .attr('stroke-dasharray', '1px');
                    })
                    .call(function (g) {
                        g.append('text').text('Mean')
                            .attr('transform', 'rotate(90)')
                            .attr('dy', '-.5em')
                            .attr('x', 100)
                            .style('font-size', '1.2rem');
                    })
                    .call(function (g) {
                        g.append('text').text(avg.toFixed(2))
                            .attr('transform', 'rotate(90)')
                            .attr('dy', '-.5em')
                            .attr('x', -10)
                            .style('font-size', '1.2rem');
                    })
            }

            for (const c of Object.keys(viz.data.scores)) {
                const circles = circleGroup.selectAll('circle.bubble#' + c);

                const extents = d3.extent(circles._groups[0], function (d) {
                    return d.__data__.score;
                });

                if (extents[0] == null) continue;

                circleGroup.insert('line', 'circle#' + c).attr('id', c).attr('x1', scaleX(extents[0])).attr('x2', scaleX(extents[1]))
                    .attr('stroke', '#666').attr('y1', function (d) {
                        return scaleY(c);
                    }).attr('y2', function (d) {
                        return scaleY(c);
                    }).attr('opacity', .5);

                circleGroup.insert('circle', 'circle#' + c).attr('id', c)
                    .attr('class', 'end-point')
                    .attr('r', 2).attr('fill', '#666')
                    .attr('cx', scaleX(extents[0])).attr('cy', scaleY(c)).attr('opacity', .5);
                circleGroup.insert('circle', 'circle#' + c).attr('id', c)
                    .attr('class', 'end-point')
                    .attr('r', 2).attr('fill', '#666')
                    .attr('cx', scaleX(extents[1])).attr('cy', scaleY(c)).attr('opacity', .5);

                circleGroup.insert('text').text(function () {
                        return viz.data.codes[c];
                    }).attr('id', c).attr('x', scaleX(extents[1]) + 20).attr('y', function () {
                        return scaleY(c);
                    }).attr('alignment-baseline', 'middle').attr('dy', '.1em').style('font-size', '1.2rem')
                    .style('font-weight', 300).attr('opacity', .5);
            }
        }, viz.TRANS_DURATION);
    }
}(window.viz = window.viz || {}));