(function (viz) {
    'use strict';

    const chartContainer = d3.select('#first');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 50,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
    const width = boundingRect.width - margin.left - margin.right;
    const height = boundingRect.height - margin.top - margin.bottom;

    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom);

    const scaleX = d3.scaleLinear().domain([0, 100]).range([0, width]);
    let scaleY;
    const scaleR = d3.scaleOrdinal().domain(d3.range(2012, 2020)).range([2, 3, 4, 5, 6, 7, 8, 9]);
    let colorScale;

    const tooltip = chartContainer.select('.tooltip');

    const clickedObj = {
        'year': null,
        'clicked': false
    };

    viz.initByCountry = function () {
        scaleY = d3.scaleOrdinal().domain(Object.keys(viz.data.scores)).range(d3.range(0, 4000, 22));
        colorScale = d3.scaleOrdinal().domain(Object.keys(viz.data.regions)).range(['#E74C3C', '#913D88', '#F5AB35', '#1BBC9B', '#3498DB', '#336E7B']);

        const makeLegend = function () {
            const legendWidth = 800;
            const legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(' + (width + margin.left + margin.right - legendWidth) / 2 + ',' + margin.top / 2 + ')');

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
            .style('font-size', '1.4rem')
            .attr('dy', '.1em');

            const yearGroups = legendTicks.append('g').attr('class', 'legendYear').data(d3.range(2012, 2020))
                .enter().append('g').attr('class', 'yearGroup')
                .attr('transform', function (d, i) {
                    return 'translate(' + (i * 60 + 350) + ', 90)';
                });

            yearGroups.append('circle').attr('r', function (d) {
                return scaleR(d);
            }).attr('fill', 'none').style('stroke-width', '3px').style('stroke', '#666');
            yearGroups.append('text').text(function (d) {
                return d;
            }).style('alignment-baseline', 'middle')
                .attr('x', 15)
                .style('font-size', '1.4rem')
                .attr('transform', 'rotate(-45)')
                .style('cursor', 'pointer')
                .on('mouseover', function (d) {
                    d3.select(this).style('font-weight', 500);
                })
                .on('mouseout', function (d) {
                    d3.select(this).style('font-weight', null);
                })
                .on('click', function (d) {
                    if (d == clickedObj.year) {
                        viz.yearDim.filter();
                        clickedObj.year = null;
                        clickedObj.clicked = false;

                    } else {
                        viz.yearDim.filter(d);
                        clickedObj.year = d;
                        clickedObj.clicked = true;
                    }

                    viz.updateByCountry(viz.yearDim.top(Infinity));
                });

            legend.append('text').text('Click on year labels to filter data by year')
                .style('font-weight', 300).style('font-size', '1.4rem')
                .attr('transform', 'translate(0,' + (margin.top + 30) + ')')
                .style('alignment-baseline', 'middle');
        }

        const makeAxis = function () {
            const xAxisTop = svg.append('g').attr('class', 'x-axis-top').attr('transform', 'translate(' + margin.left + ',' + 3.5 * margin.top + ')');
            const xTicksTop = xAxisTop.selectAll('.x-ticks').data(d3.range(scaleX.domain()[0], scaleX.domain()[1] + 1, 10))
                .enter().append('g').attr('class', 'x-ticks');

            xTicksTop.append('line').attr('x1', function (d) {
                return scaleX(d);
            }).attr('x2', function (d) {
                return scaleX(d);
            }).attr('y1', -6).attr('y2', function (d) {
                if (d == 50) return height - margin.top - margin.bottom;

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
            .attr('y', -10).style('font-size', '1.2rem').style('font-weight', 500);

            const xAxisBottom = svg.append('g').attr('class', 'x-axis-bottom').attr('transform', 'translate(' + margin.left + ',' + (height + margin.bottom + 10) + ')');
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
                .attr('y', -10).style('font-size', '1.2rem').style('font-weight', 500);

            svg.append('marker').attr('id', 'marker').attr('markerHeight', 10).attr('markerWidth', 10).attr('refX', 6).attr('refY', 3).attr('orient', 'auto')
                 .append('path').attr('d', 'M0,0L9,3L0,6Z').attr('fill', '#666');

            xAxisTop.append('g').attr('transform', 'translate(300, 40)').call(function (g) {
                g.append('text').text('MORE CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em');
            }).call(function (g) {
                g.append('line').attr('x1', -2).attr('x2', -50).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });

            xAxisTop.append('g').attr('transform', 'translate(415, 40)').call(function (g) {
                g.append('text').text('LESS CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em');
            }).call(function (g) {
                g.append('line').attr('x1', 80).attr('x2', 128).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });

            xAxisBottom.append('g').attr('transform', 'translate(300, -40)').call(function (g) {
                g.append('text').text('MORE CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em');
            }).call(function (g) {
                g.append('line').attr('x1', -2).attr('x2', -50).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });

            xAxisBottom.append('g').attr('transform', 'translate(415, -40)').call(function (g) {
                g.append('text').text('LESS CORRUPT').style('font-size', '1.2rem').style('alignment-baseline', 'middle')
                    .attr('dy', '.1em');
            }).call(function (g) {
                g.append('line').attr('x1', 80).attr('x2', 128).attr('stroke', '#666').attr('marker-end', 'url(#marker)');
            });
        }

        makeLegend();
        makeAxis();
        svg.append('g').attr('class', 'circleGroup').attr('transform', 'translate(' + margin.left + ',' + 5 * margin.top + ')');
        viz.updateByCountry(viz.yearDim.top(Infinity));
    }

    viz.updateByCountry = function (data) {
        const circleGroup = svg.select('.circleGroup');

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
            .on('mouseover', function (d) {
                chartContainer.select('text#' + d.code).style('font-weight', 500).style('opacity', 1);

                tooltip.select('.tooltip--heading').html(d.year);
                tooltip.select('.tooltip--info').html('<p>CPI Score ' + d.score + '</p><p>' + d.region + '</p>');
                
                const mouseCoords = d3.mouse(chartContainer.node());

                tooltip.style('left', (mouseCoords[0] + 10) + 'px');
                tooltip.style('top', (mouseCoords[1] + 10) + 'px');
                tooltip.style('border-color', function () {
                    return colorScale(d.region);
                })
            })
            .on('mouseout', function (d) {
                chartContainer.select('text#' + d.code).style('font-weight', 300).style('opacity', .5);
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

        circleGroup.selectAll('line').remove();
        circleGroup.selectAll('text').remove();
        svg.select('g#avg').remove();

        setTimeout(function () {
            if (clickedObj.clicked) {
                const avg = d3.mean(data, function (d) {
                    return d.score;
                });

                svg.insert('g', '.legend').attr('id', 'avg')
                    .attr('transform', function () {
                        return 'translate(' + (scaleX(avg) + margin.left) + ', 175)';
                    })
                    .call(function (g) {
                        g.append('line').attr('y1', 0).attr('y2', height - margin.top - margin.bottom - 50)
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
                            .style('font-size', '1.2rem');
                    })
            }

            for (const c of Object.keys(viz.data.scores)) {
                const circles = circleGroup.selectAll('circle#' + c);

                const extents = d3.extent(circles._groups[0], function (d) {
                    return d.__data__.score;
                });

                if (extents[0] == null) continue;

                circleGroup.insert('line', 'circle#' + c).attr('id', c).attr('x1', scaleX(extents[0])).attr('x2', scaleX(extents[1]))
                    .attr('stroke', '#666').attr('y1', function (d) {
                        return scaleY(c);
                    }).attr('y2', function (d) {
                        return scaleY(c);
                    }).style('opacity', .5);

                circleGroup.insert('text').text(function () {
                        return viz.data.codes[c];
                    }).attr('id', c).attr('x', scaleX(extents[1]) + 20).attr('y', function () {
                        return scaleY(c);
                    }).style('alignment-baseline', 'middle').attr('dy', '.1em').style('font-size', '1.2rem')
                    .style('font-weight', 300).style('opacity', .5);
            }
        }, 1000);
    }
}(window.viz = window.viz || {}));