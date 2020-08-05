(function (viz) {
    'use strict';

    /* adattároló */
    viz.data = {};

    viz.TRANS_DURATION = 1000;

    viz.init = function () {
        viz.initByCountry();
    }

    viz.makeFilterAndDimension = function (data) {
        viz.filter = crossfilter(data);

        viz.yearDim = viz.filter.dimension(function (o) {
            return o.year;
        });
    }

    viz.makeDataByCountry = function () {
        let data = [];

        for (const y of d3.range(2012, 2020)) {
            for (const c of Object.keys(viz.data.scores)) {
                if (viz.data.scores[c]['CPI Score ' + y] == null) continue;

                data.push({
                    'code': c,
                    'country': viz.data.scores[c]['Country'],
                    'region': viz.data.scores[c]['Region'],
                    'year': y,
                    'score': viz.data.scores[c]['CPI Score ' + y]
                });
            }
        }

        return data;
    }
} (window.viz = window.viz || {}));