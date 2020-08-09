(function (viz) {
    'use strict';

    /* adattároló */
    viz.data = {};

    viz.GEOS = {};

    viz.TRANS_DURATION = 750;

    viz.init = function () {
        viz.initByCountry();

        viz.GEOS = viz.associateCountryToGeo();
        viz.initcpiVshdi();

        viz.initcpiVsdem();

        viz.cpiVsSchoolingYearDim.filter(2017);
        viz.initcpiVsschooling(viz.cpiVsSchoolingYearDim.top(Infinity));
    }

    viz.multivalue_filter = function (values) {
        return function (v) {
            return values.indexOf(v) !== -1;
        };
    }

    viz.makeFilterAndDimensionByCountry = function (data) {
        viz.filter = crossfilter(data);

        viz.byCountryData = viz.filter.dimension(function (o) {
            return o.year;
        });
    }

    viz.makeFilterAndDimensionCpiVsDem = function (data) {
        viz.filter = crossfilter(data);

        viz.cpiVsDemYearDim = viz.filter.dimension(function (o) {
            return o.year;
        });

        viz.cpiVsDemRegimeDim = viz.filter.dimension(function (o) {
            return o.regime;
        });

        viz.cpiVsDemRegionDim = viz.filter.dimension(function (o) {
            return o.region;
        });
    }

    viz.makeFilterAndDimensionCpiVsSchooling = function (data) {
        viz.filter = crossfilter(data);

        viz.cpiVsSchoolingYearDim = viz.filter.dimension(function (o) {
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

    viz.associateCountryToGeo = function () {
        const mapFeatures = topojson.feature(viz.data.map, viz.data.map.objects.countries).features;

        let data = {};

        mapFeatures.forEach(function (m) {
            data[m.properties.name] = m;
        });

        return data;
    }

    viz.makeDataCpiVsHdi = function (year) {
        let data = [];

        for (const c of Object.keys(viz.data.scores)) {
            if (viz.data.scores[c]['HDI Score ' + year] == null) continue;
            if (viz.data.scores[c]['CPI Score ' + year] == null) continue;
            if (viz.GEOS[viz.data.scores[c]['Country']] == null) continue;

            data.push({
                'code': c,
                'country': viz.data.scores[c]['Country'],
                'region': viz.data.scores[c]['Region'],
                'year': year,
                'cpi': viz.data.scores[c]['CPI Score ' + year],
                'hdi': viz.data.scores[c]['HDI Score ' + year],
                'geo': viz.GEOS[viz.data.scores[c]['Country']]
            });
        }

        return data;
    }

    viz.decideRegime = function (score) {
        if (score >= 80) return 'Full';
        else if (score >= 60) return 'Flawed';
        else if (score >= 40) return 'Hybrid';
        else return 'Authoritarian';
    }

    viz.makeDataCpiVsDem = function () {
        let data = [];

        for (const y of d3.range(2012, 2020)) {
            for (const c of Object.keys(viz.data.scores)) {
                if (viz.data.scores[c]['CPI Score ' + y] == null) continue; 
                if (viz.data.scores[c]['Dem Score ' + y] == null) continue;

                data.push({
                    'code': c,
                    'country': viz.data.scores[c]['Country'],
                    'region': viz.data.scores[c]['Region'],
                    'year': y,
                    'cpi': viz.data.scores[c]['CPI Score ' + y],
                    'dem': viz.data.scores[c]['Dem Score ' + y],
                    'regime': viz.decideRegime(viz.data.scores[c]['Dem Score ' + y])
                });
            }
        }

        return data;
    }

    viz.makeDataCpiVsSchooling = function () {
        let data = [];

        for (const y of d3.range(2012, 2018)) {
            for (const c of Object.keys(viz.data.scores)) {
                if (viz.data.scores[c]['CPI Score ' + y] == null) continue;
                if (viz.data.scores[c]['EDU Score ' + y] == null) continue;
                
                data.push({
                    'code': c,
                    'country': viz.data.scores[c]['Country'],
                    'region': viz.data.scores[c]['Region'],
                    'year': y,
                    'cpi': viz.data.scores[c]['CPI Score ' + y],
                    'edu': viz.data.scores[c]['EDU Score ' + y],
                });
            }
        }

        return data;
    }
} (window.viz = window.viz || {}));