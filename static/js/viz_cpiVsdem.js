(function (viz) {
    'use strict';

    /* alapvető változók */
    const chartContainer = d3.select('#cpiVsdem .chart');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 150,
        'left': 50,
        'right': 15,
        'bottom': 50
    };

    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    const svg = chartContainer.append('svg').attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right);

    /* nyomon követik, hogy melyik évet/régiót/rezsimet választotta ki a felhasználó */
    let clickedYears = {
        2012: false,
        2013: false,
        2014: false,
        2015: false,
        2016: false,
        2017: false,
        2018: false,
        2019: true
    };
    let activeYears = [2019];

    let clickedRegime = {
        'clicked': false,
        'regime': null
    };

    let clickedRegion = {
        'clicked': false,
        'region': null
    };

    /* skálák */
    const scaleX = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const scaleY = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    const colorScale = d3.scaleOrdinal().range(['#E74C3C', '#913D88', '#F5AB35', '#1BBC9B', '#3498DB', '#336E7B']);
    const radius = 8;

    const tooltip = chartContainer.select('.tooltip');

    /* regressziós görbe kiszámolásáért, és hozzáadásáért felelős függvények */
    const polynomialRegression = d3.regressionPoly()
        .x(function (d) {
            return d.dem;
        })
        .y(function (d) {
            return d.cpi;
        })
        .order(3);
    const linePolynomial = d3.line().x(function (d) {
        return scaleX(d[0]);
    }).y(function (d) {
        return scaleY(d[1]);
    });

    /* létrehozza az alapvető elemeket, jelmagyarázat-tengelyek-mousearea */
    viz.initcpiVsdem = function () {
        colorScale.domain(Object.keys(viz.data.regions));

        /* jelmagyarázat */
        const makeLegend = function () {
            const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + margin.left + ', 20)');

            const regions = legend.append('g').attr('class', 'legendGroup').selectAll('.region-label')
                .data(colorScale.domain());

            regions.enter().append('circle').attr('r', radius)
                .attr('fill', function (d) {
                    return colorScale(d);
                }).attr('cx', function (d, i) {
                    if (i % 2) return i * 100 - 100;

                    else return i * 100;
                }).attr('cy', function (d, i) {
                    if (i % 2) return 45;
                    else return 0;
                });

            regions.enter().append('text')
                .attr('class', 'region-label')
                .attr('id', function (d) {
                    if (d == 'WE/EU') return 'WE';

                    return d;
                })
                .text(function (d) {
                    return viz.data.regions[d];
                }).attr('transform', function (d, i) {
                    if (i % 2) return 'translate(' + (i * 100 - 100) + ', 45)';
                    else return 'translate(' + (i * 100) + ', 0)';
                }).style('alignment-baseline', 'middle').attr('x', 15).attr('dy', '.11em').style('font-size', '1.2rem')
                .attr('fill', '#666')
                .style('cursor', 'pointer')
                .on('mousemove', function (d) {
                    d3.select(this).attr('font-weight', 700).attr('fill', '#f4d03f');
                })
                .on('mouseout', function (d) {
                    if (clickedRegion.region == d) return d3.select(this).attr('font-weight', 700).attr('fill', '#f4d03f');
                    else return d3.select(this).attr('font-weight', null).attr('fill', '#666');
                })
                .on('click', function (d) {
                    if (clickedRegion.region == d) {
                        clickedRegion.region = null;
                        clickedRegion.clicked = false;
                    } else {
                        clickedRegion.region = d;
                        clickedRegion.clicked = true;
                    }

                    if (clickedRegion.region == null) {
                        viz.cpiVsDemRegionDim.filter();
                    } else {
                        viz.cpiVsDemRegionDim.filter(clickedRegion.region);
                    }

                    for (const r of Object.keys(viz.data.regions)) {
                        if (r == 'WE/EU' && clickedRegion.region == r) legend.select('text#' + 'WE').attr('font-weight', 700);
                        else if (r == clickedRegion.region) legend.select('text#' + r).attr('font-weight', 700);
                        else if (r == 'WE/EU') legend.select('text#' + 'WE').attr('font-weight', null).attr('fill', '#666');
                        else legend.select('text#' + r).attr('font-weight', null).attr('fill', '#666');
                    }

                    viz.updatecpiVsdem(viz.cpiVsDemYearDim.top(Infinity));
                });

            const yearGroups = legend.selectAll('.yearGroup').data(d3.range(2012, 2020));

            yearGroups.enter().append('g').attr('class', 'yearGroup')
                .style('cursor', 'pointer')
                .attr('transform', function (d, i) {
                    return 'translate(' + (i * 75) + ', 90)';
                })
                .on('mousemove', function (d) {
                    d3.select(this).select('.year-label').attr('font-weight', 700).attr('fill', '#f4d03f');
                    d3.select(this).select('.year-circle').attr('fill', '#f4d03f');
                })
                .on('mouseout', function (d) {
                    if (!clickedYears[d]) {
                        d3.select(this).select('.year-label').attr('font-weight', null).attr('fill', '#666');
                        d3.select(this).select('.year-circle').attr('fill', '#ddd');
                    }
                })
                .on('click', function (d) {
                    const labels = legend.selectAll('.year-label');
                    const circles = legend.selectAll('.year-circle')

                    if (activeYears.length == 1 && clickedYears[d]) {
                        window.alert('You must select a single year to filter.');
                        return;
                    } else {
                        for (const y of Object.keys(clickedYears)) {
                            if (clickedYears[y]) {
                                clickedYears[y] = !clickedYears[y];
                                d3.select(labels._groups[0][Object.keys(clickedYears).indexOf(y)]).attr('font-weight', null)
                                    .attr('fill', '#666');
                                d3.select(circles._groups[0][Object.keys(clickedYears).indexOf(y)]).attr('fill', '#ddd');
                            }
                        }

                        clickedYears[d] = !clickedYears[d];
                        d3.select(this).select('.year-label').attr('font-weight', 700).attr('fill', '#f4d03f');
                        d3.select(this).select('.year-circle').attr('fill', '#f4d03f');
                    }

                    activeYears = Object.keys(clickedYears).filter(function (m) {
                        return clickedYears[m];
                    }).map(function (m) {
                        return parseInt(m);
                    });

                    viz.cpiVsDemYearDim.filterFunction(viz.multivalue_filter(activeYears));
                    viz.updatecpiVsdem(viz.cpiVsDemYearDim.top(Infinity));
                })
                .call(function (g) {
                    g.append('circle')
                        .attr('r', radius).attr('fill', function (d) {
                            if (clickedYears[d]) return '#f4d03f';
                            else return '#ddd';
                        })
                        .attr('class', 'year-circle');
                })
                .call(function (g) {
                    g.append('text')
                        .attr('class', 'year-label')
                        .attr('alignment-baseline', 'middle').style('font-size', '1.2rem').attr('fill', function (d) {
                            if (d === activeYears[0]) return '#f4d03f';
                            else return '#666';
                        }).attr('dy', '.2em')
                        .attr('font-weight', function (d) {
                            if (d === activeYears[0]) return 700;
                            else return null;
                        })
                        .text(function (d) {
                            return d;
                        }).style('font-size', '1.2rem')
                        .attr('x', 20);
                });

            legend.append('text').text('Click on year/region/regime labels to filter data')
                .attr('transform', 'translate(' + (colorScale.domain().length * 100) + ', 0)')
                .style('font-size', '1.1rem').style('alignment-baseline', 'middle').attr('dy', '.11em')
                .attr('fill', '#666');
        }

        makeLegend();

        /* tengelyek */
        const makeAxis = function () {
            const xAxis = svg.append('g').attr('class', 'x-axis')
                .attr('transform', 'translate(' + margin.left + ', ' + (margin.top + height) + ')');
            const xTicks = xAxis.selectAll('.x-ticks').data(d3.range(scaleX.domain()[0], scaleX.domain()[1] + 1, 20))
                .enter().append('g').attr('class', 'x-ticks');

            xTicks.append('line').attr('x1', function (d) {
                    return scaleX(d);
                })
                .attr('x2', function (d) {
                    return scaleX(d);
                }).attr('y1', -6).attr('y2', 6).attr('stroke', function (d) {
                    if (d == 20) return;

                    return '#666';
                });

            xTicks.append('text').text(function (d) {
                    if (d <= 20) return;

                    return d;
                }).attr('transform', function (d) {
                    return 'translate(' + scaleX(d) + ', -10)';
                }).style('text-anchor', 'middle').style('font-size', '1.2rem').style('font-weight', 500)
                .attr('fill', '#666');

            xTicks.append('text').text(function (d) {
                    if (d == 0) {
                        return 'Authoritarian regime'
                    } else if (d == 40) {
                        return 'Hybrid regime';
                    } else if (d == 60) {
                        return 'Flawed democracy';
                    } else if (d == 80) {
                        return 'Full democracy';
                    }
                })
                .attr('id', function (d) {
                    return viz.decideRegime(d);
                })
                .attr('fill', '#666')
                .attr('transform', function (d) {
                    if (d == 0) {
                        return 'translate(' + (scaleX(40) - (scaleX(40) - scaleX(0)) / 2) + ', 0)';
                    } else {
                        return 'translate(' + (scaleX(d + 20) - (scaleX(d + 20) - scaleX(d)) / 2) + ', 0)';
                    }
                }).style('text-anchor', 'middle').style('font-size', '1.4rem').style('alignment-baseline', 'middle')
                .style('cursor', 'pointer')
                .on('mousemove', function (d) {
                    d3.select(this).attr('font-weight', 700).attr('fill', '#f4d03f');
                })
                .on('mouseout', function (d) {
                    if (clickedRegime.regime == viz.decideRegime(d)) return d3.select(this).attr('font-weight', 700).attr('fill', '#f4d03f');
                    else return d3.select(this).attr('font-weight', null).attr('fill', '#666');
                })
                .on('click', function (d) {
                    if (clickedRegime.regime == viz.decideRegime(d)) {
                        clickedRegime.regime = null;
                        clickedRegime.clicked = false;
                    } else {
                        clickedRegime.regime = viz.decideRegime(d);
                        clickedRegime.clicked = true;
                    }

                    if (clickedRegime.regime == null) {
                        viz.cpiVsDemRegimeDim.filter();
                    } else {
                        viz.cpiVsDemRegimeDim.filter(clickedRegime.regime);
                    }

                    for (const r of ['Authoritarian', 'Hybrid', 'Flawed', 'Full']) {
                        if (r == clickedRegime.regime) d3.select('text#' + r).attr('font-weight', 700).attr('fill', '#f4d03f');
                        else d3.select('text#' + r).attr('font-weight', null).attr('fill', '#666');
                    }

                    viz.updatecpiVsdem(viz.cpiVsDemYearDim.top(Infinity));
                });

            const yAxis = svg.append('g').attr('class', 'y-axis')
                .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
            const yTicks = yAxis.selectAll('.y-ticks').data(d3.range(scaleY.domain()[0], scaleY.domain()[1] + 1, 20))
                .enter().append('g').attr('class', 'y-ticks');

            yTicks.append('line').attr('x1', -6).attr('x2', function (d) {
                    if (d == 0) return 6;

                    return width;
                })
                .attr('stroke-dasharray', function (d) {
                    if (d == 0) return null;

                    return '5px';
                })
                .attr('y1', function (d) {
                    return scaleY(d);
                }).attr('y2', function (d) {
                    return scaleY(d);
                }).attr('stroke', '#666').attr('stroke-opacity', .75);

            yTicks.append('text').text(function (d) {
                    if (d == 0) return;

                    return d;
                }).attr('transform', function (d) {
                    return 'translate(-5, ' + (scaleY(d) - 10) + ')';
                }).attr('alignment-baseline', 'middle').style('font-size', '1.2rem').style('font-weight', 500)
                .attr('fill', '#666');

            svg.append('text').text('CPI').style('font-size', '1.6rem')
                .attr('transform', 'translate(30, ' + (margin.top + height) / 2 + ') rotate(-90)').style('text-anchor', 'middle')
                .attr('fill', '#666');
            svg.append('text').text('Democracy Index').style('font-size', '1.6rem').style('text-anchor', 'middle')
                .attr('transform', 'translate(' + (margin.left + width) / 2 + ', ' + (margin.top + height + margin.bottom / 2 + 15) + ')')
                .attr('fill', '#666');
        }

        makeAxis();

        const mouseArea = svg.insert('g', '.legend').attr('class', 'mouse-area').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
            .call(function (g) {
                g.append('rect').attr('width', width).attr('height', height).attr('fill', 'transparent');
            })
            .call(function (g) {
                g.append('line').attr('class', 'x-line').attr('stroke', '#ddd').attr('stroke-dasharray', '.5px').transition().duration(viz.TRANS_DURATION / 5);
                g.append('text').attr('class', 'x-text');

                g.append('line').attr('class', 'y-line').attr('stroke', '#ddd').attr('stroke-dasharray', '.5px').transition().duration(viz.TRANS_DURATION / 5);
                g.append('text').attr('class', 'y-text');
            })
            .on('mousemove', function () {
                const g = chartContainer.select('.mouse-area');

                const mouseCoords = d3.mouse(g.node());

                g.select('.x-line').attr('opacity', 1).attr('x1', mouseCoords[0]).attr('x2', mouseCoords[0])
                    .attr('y1', height).attr('y2', mouseCoords[1]);
                g.select('.x-text').attr('opacity', 1).text(scaleX.invert(mouseCoords[0]).toFixed(0))
                    .attr('transform', 'translate(' + (mouseCoords[0] + 10) + ', ' + (height - 10) + ')');

                g.select('.y-line').attr('opacity', 1).attr('x1', 0).attr('x2', mouseCoords[0])
                    .attr('y1', mouseCoords[1]).attr('y2', mouseCoords[1]);
                g.select('.y-text').attr('opacity', 1).text(scaleY.invert(mouseCoords[1]).toFixed(0))
                    .attr('transform', 'translate(10, ' + (mouseCoords[1] - 10) + ')');
            })
            .on('mouseleave', function () {
                const g = chartContainer.select('.mouse-area');

                g.select('.x-line').attr('opacity', 0);
                g.select('.y-line').attr('opacity', 0);
                g.select('.x-text').attr('opacity', 0);
                g.select('.y-text').attr('opacity', 0);
            });

        svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
            .append('path').attr('class', 'regression').attr('fill', 'none').attr('stroke', '#f4d03f').attr('stroke-width', 10)
            .attr('opacity', .25)
            .on('mouseover', function () {
                d3.select(this).attr('opacity', 1);
            })
            .on('mouseleave', function () {
                d3.select(this).attr('opacity', .25);
            });
        svg.append('g').attr('class', 'bubbles').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
        viz.cpiVsDemYearDim.filterFunction(viz.multivalue_filter(activeYears));
        viz.updatecpiVsdem(viz.cpiVsDemYearDim.top(Infinity));
    }

    /* frissítés */
    viz.updatecpiVsdem = function (data) {
        const bubbles = svg.select('.bubbles').selectAll('.bubble').data(data, function (d) {
            return d.code;
        });

        bubbles.enter().append('circle').attr('class', 'bubble').attr('id', function (d) {
                return d.code;
            }).attr('r', 0)
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('opacity', 1)
            .merge(bubbles)
            .on('mousemove', function (d) {
                d3.selectAll('.bubble').transition().duration(viz.TRANS_DURATION / 4).attr('opacity', .5);
                d3.select(this).transition().duration(viz.TRANS_DURATION / 4).attr('opacity', 1);

                tooltip.select('.tooltip--heading').html(d.country);
                tooltip.select('.tooltip--info').html(
                    '<p>CPI Score ' + d.cpi + '</p><p>Democracy Index ' + d.dem + '</p>'
                );

                const mouseCoords = d3.mouse(chartContainer.node());

                if (mouseCoords[0] > width * 0.75) {
                    tooltip.style('left', (mouseCoords[0] - parseInt(tooltip.style('width')) - 10) + 'px');
                } else {
                    tooltip.style('left', (mouseCoords[0] + 10) + 'px');
                }

                tooltip.style('top', (mouseCoords[1] + 10) + 'px');
            }).on('mouseout', function (d) {
                d3.selectAll('.bubble').transition().duration(viz.TRANS_DURATION / 4).attr('opacity', 1);

                tooltip.style('left', '-9999px');
            })
            .transition().duration(viz.TRANS_DURATION)
            .attr('r', radius)
            .attr('cx', function (d) {
                return scaleX(d.dem);
            }).attr('cy', function (d) {
                return scaleY(d.cpi);
            }).attr('fill', function (d) {
                return colorScale(d.region);
            })
            .style('cursor', 'pointer');

        bubbles.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0).remove();

        /* csak akkor jeleníti meg a regressziós görbét, ha sem rezsim, sem régió nincs kiválasztva */
        if (!clickedRegime.clicked && !clickedRegion.clicked) {
            setTimeout(function () {
                svg.select('.regression').datum(polynomialRegression(data))
                    .transition().duration(viz.TRANS_DURATION)
                    .attr('opacity', .25)
                    .attr('d', linePolynomial);
            }, viz.TRANS_DURATION);
        } else {
            svg.select('.regression')
                .transition().duration(viz.TRANS_DURATION)
                .attr('opacity', 0)
                .attr('d', null);
        }
    }
}(window.viz = window.viz || {}));