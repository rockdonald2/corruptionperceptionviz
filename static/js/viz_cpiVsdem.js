(function (viz) {
    'use strict';

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

    let activeYears = [2019];

    const scaleX = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const scaleY = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    const colorScale = d3.scaleOrdinal().range(['#E74C3C', '#913D88', '#F5AB35', '#1BBC9B', '#3498DB', '#336E7B']);
    const radius = 8;

    viz.initcpiVsdem = function () {
        colorScale.domain(Object.keys(viz.data.regions));

        const makeLegend = function () {
            
        }

        makeLegend();

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
            }).style('text-anchor', 'middle').style('font-size', '1.2rem').style('font-weight', 500);

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
            }).attr('transform', function (d) {
                if (d == 0) {
                    return 'translate(' + (scaleX(40) - (scaleX(40) - scaleX(0)) / 2) + ', 0)';
                } else {
                    return 'translate(' + (scaleX(d + 20) - (scaleX(d + 20) - scaleX(d)) / 2) + ', 0)';
                } 
            }).style('text-anchor', 'middle').style('font-size', '1.4rem').style('alignment-baseline', 'middle');

            const yAxis = svg.append('g').attr('class', 'y-axis')
                .attr('transform', 'translate(' + margin.left + ', ' + margin.top  + ')');
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
            }).attr('alignment-baseline', 'middle').style('font-size', '1.2rem').style('font-weight', 500);

            svg.append('text').text('CPI').style('font-size', '1.6rem')
                .attr('transform', 'translate(30, ' + (margin.top + height) / 2 + ') rotate(-90)').style('text-anchor', 'middle');
            svg.append('text').text('Democracy Index').style('font-size', '1.6rem').style('text-anchor', 'middle')
                .attr('transform', 'translate(' + (margin.left + width) / 2 + ', ' + (margin.top + height + margin.bottom / 2 + 15) + ')');
        }

        makeAxis();

        svg.append('g').attr('class', 'bubbles').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
        viz.cpiVsDemData.filterFunction(viz.multivalue_filter(activeYears));
        viz.updatecpiVsdem(viz.cpiVsDemData.top(Infinity));
    }

    viz.updatecpiVsdem = function (data) {
        const bubbles = svg.select('.bubbles').selectAll('.bubble').data(data, function (d) {
            return d.code;
        });

        bubbles.enter().append('circle').attr('class', 'bubble').attr('id', function (d) {
            return d.code;
        }).attr('r', radius)
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .merge(bubbles)
        .on('mousemove', function (d) {
            d3.selectAll('.bubble').transition().duration(viz.TRANS_DURATION / 4).style('opacity', .5);
            d3.select(this).transition().duration(viz.TRANS_DURATION / 4).style('opacity', 1);
        }).on('mouseout', function (d) {
            d3.selectAll('.bubble').transition().duration(viz.TRANS_DURATION / 4).style('opacity', 1);
        })
        .transition().duration(viz.TRANS_DURATION)
        .attr('cx', function (d) {
            return scaleX(d.dem);
        }).attr('cy', function (d) {
            return scaleY(d.cpi);
        }).attr('fill', function (d) {
            return colorScale(d.region);
        })
        .style('cursor', 'pointer');

        bubbles.exit().remove();
    }
} (window.viz = window.viz || {}));