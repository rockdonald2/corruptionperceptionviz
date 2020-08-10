(function (viz) {
    'use strict';

    d3.queue()
        .defer(d3.json, 'static/data/combined.json')
        .defer(d3.json, 'static/data/codes.json')
        .defer(d3.json, 'static/data/regions.json')
        .defer(d3.json, 'static/data/map.json')
        .await(ready);

    function ready (error, combinedData, codesData, regionsData, mapData) {
        /* ha valamilyen hiba történt álljon le */
        if (error) {
            return console.warn(error);
        }

        /* adatok lementése és dimenziók létrehozása */
        viz.data.scores = combinedData;
        viz.data.codes = codesData;
        viz.data.regions = regionsData;
        viz.data.map = mapData;
        viz.makeFilterAndDimensionByCountry(viz.makeDataByCountry());
        viz.makeFilterAndDimensionCpiVsDem(viz.makeDataCpiVsDem());
        viz.makeFilterAndDimensionCpiVsSchooling(viz.makeDataCpiVsSchooling());

        /* az ábralétrehozási folyamat elindítása */
        setTimeout(function () {
            viz.init();

            d3.select('body').attr('class', '');
            d3.select('.overlay').attr('class', 'overlay');
        }, viz.TRANS_DURATION);
    }

}(window.viz = window.viz || {}));