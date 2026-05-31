angular.module('myApp').factory('apiService', function ($http, $q) {
    var apiBaseUrl = "https://api.coingecko.com/api/v3/";
    var currencyApiBase = "https://latest.currency-api.pages.dev/v1/";
    var factory = {};
    factory.getCurrencyCodesAndNames = function () {
        return $http.get(currencyApiBase + "currencies.json");
    };
    factory.getUsdRates = function () {
        return $http.get(currencyApiBase + "currencies/usd.json");
    };
    factory.getAllSupportedCurrencies = function () {
        let url = apiBaseUrl + "simple/supported_vs_currencies";
        var req = {
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': "application/json"
            },
        }
        return $http(req);
    }
    factory.getAllSupportedCurrenciesFullName = function () {
        let url = apiBaseUrl + "coins/list";
        var req = {
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': "application/json"
            },
        }
        return $http(req);
    }
    factory.getMarketPrices = function (data) {
        let url = apiBaseUrl + "coins/markets?vs_currency=" + data.name + "&order=market_cap_desc&per_page=250&page=1&sparkline=false";
        var req = {
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': "application/json"
            },
        }
        return $http(req);
    }
    return factory;
});