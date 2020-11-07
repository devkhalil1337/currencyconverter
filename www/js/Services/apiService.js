angular.module('myApp').factory('apiService', function ($http, $q) {
    var apiBaseUrl = "https://api.coingecko.com/api/v3/";
    var factory = {};
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
    factory.getCurrenciesPrice = function (data) {
        let url = apiBaseUrl + "simple/price?ids="+data.selectedFromCurr+"&vs_currencies="+data.selectedToCurr;
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