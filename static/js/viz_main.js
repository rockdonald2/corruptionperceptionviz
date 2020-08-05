(function (viz) {
    'use strict';

    d3.queue()
        .defer(d3.json, 'static/data/combined.json')
        .defer(d3.json, 'static/data/codes.json')
        .defer(d3.json, 'static/data/regions.json')
        .await(ready);

    function ready (error, combinedData, codesData, regionsData) {
        /* ha valamilyen hiba történt álljon le */
        if (error) {
            return console.warn(error);
        }

        viz.data.scores = combinedData;
        viz.data.codes = codesData;
        viz.data.regions = regionsData;
        viz.makeFilterAndDimension(viz.makeDataByCountry());

        viz.init();
    }

}(window.viz = window.viz || {}));