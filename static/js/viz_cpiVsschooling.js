(function (viz) {
    'use strict';

    const chartContainer = d3.select('#cpiVsschooling .chart');
    const boundingRect = chartContainer.node().getBoundingClientRect();
    const margin = {
        'top': 100,
        'left': 0,
        'right': 0,
        'bottom': 0
    };

    const width = boundingRect.width + margin.left + margin.right;
    const height = boundingRect.height + margin.top + margin.bottom;

    let clickedYears = {
        2012: false,
        2013: false,
        2014: false,
        2015: false,
        2016: false,
        2017: true
    };
    let activeYears = [2017];

    const individualPlotSizes = {
        'width': 540,
        'height': 300,
        'margin': {
            'top': 15,
            'left': 30,
            'right': 30,
            'bottom': 75
        }
    };

    const individualPlots = {};

    const scaleCPI = d3.scaleLinear().domain([0, 100]).range([individualPlotSizes.height, 0]);
    const scaleEDU = d3.scaleLinear().range([individualPlotSizes.height, 0]);
    const scaleX = d3.scaleBand().range([0, individualPlotSizes.width]).padding(0.2);
    const colors = {
        'EDU': '#86E2D5',
        'CPI': '#F4D03F'
    }

    const tooltip = chartContainer.select('.tooltip');

    const sumData = function (data) {
        let summed = {}

        d3.nest().key(function (d) {
            return d.region;
        }).entries(data).forEach(function (d) {
            summed[d.key] = d.values;
        });

        return summed;
    }

    const handleMouseEnter = function (node, data) {
        tooltip.select('.tooltip--heading').html(data.country);
        tooltip.select('.tooltip--info').html(
            '<p>CPI Score ' + data.cpi + '</p><p>Average years of schooling is ' + data.edu + ' years</p>'
        );

        chartContainer.select('.x-ticks text#' + d3.select(node).attr('id')).attr('font-weight', 500).attr('fill', '#F4D03F');

        const mouseCoords = d3.mouse(chartContainer.node());

        if (mouseCoords[0] > width * 0.75) {
            tooltip.style('left', (mouseCoords[0] - parseInt(tooltip.style('width')) - 10) + 'px');
        } else {
            tooltip.style('left', (mouseCoords[0] + 10) + 'px');
        }

        tooltip.style('top', (mouseCoords[1] + 10) + 'px');
    }

    const handleMouseLeave = function (node, data) {
        chartContainer.select('.x-ticks text#' + d3.select(node).attr('id')).attr('font-weight', null).attr('fill', '#666');
        tooltip.style('left', '-9999px');
    }

    viz.initcpiVsschooling = function (data) {
        const categorized = sumData(data);

        const makeLegend = function () {
            const legendHeight = margin.top;
            const legendWidth = boundingRect.width;
            const legendRadius = 10;

            const legend = chartContainer.append('div').append('svg').attr('width', legendWidth).attr('height', legendHeight)
                .append('g').attr('class', 'legend');

            legend.append('g').attr('class', 'circleGroup').attr('transform', 'translate(' + legendWidth * 0.15 + ', ' + legendHeight * 0.75 + ')')
                .call(function (g) {
                    g.append('circle').attr('r', legendRadius).attr('fill', colors.CPI);
                })
                .call(function (g) {
                    g.append('text').text('CPI Score').attr('transform', 'translate(' + (legendRadius * 2) + ', ' + 0 + ')')
                        .attr('alignment-baseline', 'middle').style('font-size', '1.2rem').attr('fill', '#666').attr('dy', '.2em');
                });

            legend.append('g').attr('class', 'circleGroup').attr('transform', 'translate(' + legendWidth * 0.25 + ', ' + legendHeight * 0.75 + ')')
                .call(function (g) {
                    g.append('circle').attr('r', legendRadius).attr('fill', colors.EDU);
                })
                .call(function (g) {
                    g.append('text').text('Mean years of schooling').attr('transform', 'translate(' + (legendRadius * 2) + ', ' + 0 + ')')
                        .attr('alignment-baseline', 'middle').style('font-size', '1.2rem').attr('fill', '#666').attr('dy', '.2em');
                });

            const yearGroups = legend.selectAll('.yearGroup').data(d3.range(2012, 2018));

            yearGroups.enter().append('g').attr('class', 'yearGroup')
                .style('cursor', 'pointer')
                .attr('transform', function (d, i) {
                    return 'translate(' + (legendWidth * 0.45 + i * 100) + ', ' + legendHeight * 0.75 + ')';
                })
                .call(function (g) {
                    g.append('circle').attr('r', legendRadius).attr('fill', function (d) {
                        if (d === activeYears[0]) return '#f4d03f';
                        else return '#ddd';
                    }).attr('class', 'year-circle');
                })
                .call(function (g) {
                    g.append('text').text(function (d) {
                            return d;
                        })
                        .attr('class', 'year-label')
                        .attr('transform', 'translate(20, 0)')
                        .attr('alignment-baseline', 'middle').style('font-size', '1.2rem').attr('fill', function (d) {
                            if (d === activeYears[0]) return '#f4d03f';
                            else return '#666';
                        }).attr('dy', '.2em')
                        .attr('font-weight', function (d) {
                            if (d === activeYears[0]) return 500;
                            else return null;
                        });
                }).on('mousemove', function (d) {
                    d3.select(this).select('.year-circle').attr('fill', '#f4d03f');
                    d3.select(this).select('.year-label').attr('fill', '#f4d03f').attr('font-weight', 500);
                }).on('mouseleave', function (d) {
                    if (d !== activeYears[0]) {
                        d3.select(this).select('.year-circle').attr('fill', '#ddd');
                        d3.select(this).select('.year-label').attr('fill', '#666').attr('font-weight', null);
                    }
                }).on('click', function (d) {
                    const circles = legend.selectAll('.year-circle');
                    const labels = legend.selectAll('.year-label');

                    if (activeYears.length == 1 && clickedYears[d]) {
                        return;
                    } else {
                        for (const y of Object.keys(clickedYears)) {
                            if (clickedYears[y]) {
                                clickedYears[y] = !clickedYears[y];
                                d3.select(labels._groups[0][Object.keys(clickedYears).indexOf(y)]).attr('font-weight', null).attr('fill', '#666');
                                d3.select(circles._groups[0][Object.keys(clickedYears).indexOf(y)]).attr('fill', '#ddd');
                            }

                        }

                        clickedYears[d] = !clickedYears[d];
                        d3.select(this).select('.year-label').attr('fill', '#f4d03f').attr('font-weight', 500);
                        d3.select(this).select('.year-circle').attr('fill', '#f4d03f');
                    }

                    activeYears = Object.keys(clickedYears).filter(function (m) {
                        return clickedYears[m];
                    }).map(function (m) {
                        return parseInt(m);
                    });

                    viz.cpiVsSchoolingYearDim.filterFunction(viz.multivalue_filter(activeYears));
                    viz.updatecpiVsschooling(sumData(viz.cpiVsSchoolingYearDim.top(Infinity)));
                });
        }

        makeLegend();

        const individuals = chartContainer.append('div').attr('class', 'individuals');

        const makeIndividualPlots = function (keys) {
            const plots = individuals.selectAll('.individual').data(keys, function (d) {
                return d;
            });

            plots.enter().append('svg')
                .attr('class', 'individual')
                .attr('id', function (d) {
                    return d;
                })
                .attr('width', individualPlotSizes.width + individualPlotSizes.margin.left + individualPlotSizes.margin.right)
                .attr('height', individualPlotSizes.height + individualPlotSizes.margin.top + individualPlotSizes.margin.bottom)
                .append('g').attr('transform', 'translate(' + individualPlotSizes.margin.left + ', ' + individualPlotSizes.margin.top + ')')
                .attr('class', 'plot');

            d3.selectAll('.individual')._groups[0].forEach(function (p, i) {
                individualPlots[d3.select(p).attr('id')] = {};
                individualPlots[d3.select(p).attr('id')]['plot'] = p;
            });
        }

        makeIndividualPlots(d3.keys(categorized));

        const makeAxis = function (keys) {
            for (const i of keys) {
                const current = individualPlots[i];

                const plot = d3.select(current.plot);

                current['scaleCPI'] = scaleCPI.copy();
                current['scaleEDU'] = scaleEDU.copy();
                current['scaleX'] = scaleX.copy();

                const minMaxEDU = d3.extent(categorized[i], function (d) {
                    return d.edu;
                });
                current['scaleEDU'].domain([minMaxEDU[0] - 1, minMaxEDU[1] + 1]);
                current['scaleX'].domain(categorized[i].map(function (d) {
                    return d.code;
                }));

                const xAxis = plot.insert('g', '.plot').attr('class', 'x-axis')
                    .attr('transform', 'translate(' + individualPlotSizes.margin.left + ', ' + (individualPlotSizes.height + individualPlotSizes.margin.top) + ')');
                const xTicks = xAxis.selectAll('.x-ticks').data(categorized[i].map(function (d) {
                    return d.code;
                })).enter().append('g').attr('class', 'x-ticks');

                xTicks.append('line').attr('x1', function (d) {
                        return current['scaleX'](d);
                    }).attr('x2', function (d) {
                        return current['scaleX'](d);
                    }).attr('y1', 0).attr('y2', -individualPlotSizes.height)
                    .attr('stroke', '#666')
                    .attr('opacity', .25);
                xTicks.append('circle').attr('cx', function (d) {
                        return current['scaleX'](d);
                    }).attr('r', 2).attr('cy', 0).attr('stroke', '#666')
                    .attr('opacity', .25);
                xTicks.append('circle').attr('cx', function (d) {
                        return current['scaleX'](d);
                    }).attr('r', 2).attr('cy', -individualPlotSizes.height).attr('stroke', '#666')
                    .attr('opacity', .25);

                xTicks.append('text')
                    .attr('id', function (d) {
                        return d;
                    })
                    .text(function (d) {
                        return d;
                    }).attr('transform', function (d) {
                        return 'translate(' + current['scaleX'](d) + ', 20) rotate(-60)';
                    }).attr('text-anchor', 'middle').style('font-size', '1.2rem')
                    .attr('fill', '#666').attr('opacity', .75);

                const CPIAxis = plot.insert('g', '.plot').attr('class', 'cpi-axis')
                    .attr('transform', 'translate(' + 20 + ', ' + individualPlotSizes.margin.top + ')');
                CPIAxis.append('line').attr('x1', 0).attr('x2', 0).attr('y1', current['scaleCPI'](0))
                    .attr('y2', current['scaleCPI'](100)).attr('stroke', '#666').attr('opacity', .75);
                CPIAxis.append('text').text('CPI').attr('transform', 'translate(-10, 40) rotate(-90)')
                    .style('font-size', '1.2rem')
                    .attr('fill', '#666').attr('opacity', .75).attr('alignment-baseline', 'middle');
                const CPITicks = CPIAxis.selectAll('.cpi-ticks').data([0, 100]).enter().append('g').attr('class', 'cpi-ticks');

                CPITicks.append('circle').attr('r', 3).attr('cx', 0).attr('cy', function (d) {
                    return current['scaleCPI'](d);
                }).attr('fill', '#666').attr('opacity', .75);
                CPITicks.append('text').text(function (d) {
                        return d;
                    }).attr('transform', function (d) {
                        return 'translate(-10, ' + current['scaleCPI'](d) + ') rotate(-90)';
                    }).attr('text-anchor', 'middle').style('font-size', '1.2rem')
                    .attr('fill', '#666').attr('opacity', .75).attr('alignment-baseline', 'middle');

                const EDUAxis = plot.insert('g', '.plot').attr('class', 'edu-axis').attr('transform', 'translate(' + ((individualPlotSizes.width + individualPlotSizes.margin.left) + ', 15)'));
                EDUAxis.append('line').attr('x1', 0).attr('x2', 0)
                    .attr('y1', current['scaleEDU'](current['scaleEDU'].domain()[0]))
                    .attr('y2', current['scaleEDU'](current['scaleEDU'].domain()[1]))
                    .attr('stroke', '#666').attr('opacity', .75);
                EDUAxis.append('text').text('EDU').attr('transform', 'translate(10, 22.5) rotate(90)')
                    .style('font-size', '1.2rem')
                    .attr('fill', '#666').attr('opacity', .75).attr('alignment-baseline', 'middle');
                const EDUTicks = EDUAxis.selectAll('.edu-ticks').data(current['scaleEDU'].domain())
                    .enter().append('g').attr('class', 'edu-ticks');

                EDUTicks.append('circle').attr('r', 3).attr('cx', 0).attr('cy', function (d) {
                    return current['scaleEDU'](d);
                }).attr('fill', '#666').attr('opacity', .75);

                EDUTicks.append('text').text(function (d) {
                        return Math.floor(d);
                    }).attr('transform', function (d) {
                        return 'translate(10, ' + current['scaleEDU'](d) + ') rotate(90)';
                    }).attr('text-anchor', 'middle').style('font-size', '1.2rem')
                    .attr('fill', '#666').attr('opacity', .75).attr('alignment-baseline', 'middle');
            }
        }

        makeAxis(d3.keys(categorized));

        viz.updatecpiVsschooling(categorized);
    }

    viz.updatecpiVsschooling = function (categorized) {
        for (const i of d3.keys(categorized)) {
            const current = individualPlots[i];
            const plot = d3.select(current.plot).select('.plot');

            const line = plot.selectAll('.line').data(categorized[i], function (d) {
                return d.code;
            });

            line.enter().append('line')
                .attr('class', 'line')
                .attr('id', function (d) {
                    return d.code;
                })
                .attr('y1', 0).attr('y2', 0)
                .style('cursor', 'pointer')
                .merge(line)
                .attr('stroke', '#333')
                .attr('stroke-width', 2)
                .attr('x1', function (d) {
                    return current['scaleX'](d.code);
                })
                .attr('x2', function (d) {
                    return current['scaleX'](d.code);
                })
                .on('mousemove', function (d) {
                    handleMouseEnter(this, d);
                })
                .on('mouseleave', function (d) {
                    handleMouseLeave(this, d);
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('opacity', .5)
                .attr('y1', function (d) {
                    return current['scaleCPI'](d.cpi);
                }).attr('y2', function (d) {
                    return current['scaleEDU'](d.edu);
                });

            line.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0);

            const cpiCircles = plot.selectAll('.cpi-circle').data(categorized[i], function (d) {
                return d.code;
            });

            cpiCircles.enter().append('circle')
                .attr('class', 'cpi-circle')
                .attr('id', function (d) {
                    return d.code;
                })
                .style('cursor', 'pointer')
                .merge(cpiCircles)
                .attr('r', current['scaleX'].bandwidth() / 2)
                .attr('fill', colors.CPI).attr('cx', function (d) {
                    return current['scaleX'](d.code);
                })
                .on('mousemove', function (d) {
                    handleMouseEnter(this, d);
                })
                .on('mouseleave', function (d) {
                    handleMouseLeave(this, d);
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('opacity', 1)
                .attr('cy', function (d) {
                    return current['scaleCPI'](d.cpi);
                });

            cpiCircles.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0);

            const eduCircles = plot.selectAll('.edu-circle').data(categorized[i], function (d) {
                return d.code;
            });

            eduCircles.enter().append('circle')
                .attr('class', 'edu-circle')
                .attr('id', function (d) {
                    return d.code;
                })
                .attr('cy', 0)
                .style('cursor', 'pointer')
                .merge(eduCircles)
                .attr('r', current['scaleX'].bandwidth() / 2)
                .attr('fill', colors.EDU).attr('cx', function (d) {
                    return current['scaleX'](d.code);
                })
                .on('mousemove', function (d) {
                    handleMouseEnter(this, d);
                })
                .on('mouseleave', function (d) {
                    handleMouseLeave(this, d);
                })
                .transition().duration(viz.TRANS_DURATION)
                .attr('opacity', 1)
                .attr('cy', function (d) {
                    return current['scaleEDU'](d.edu);
                });

            eduCircles.exit().transition().duration(viz.TRANS_DURATION).attr('opacity', 0);
        }
    }
}(window.viz = window.viz || {}));