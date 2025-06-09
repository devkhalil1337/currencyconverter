angular.module('myApp').factory('currencyService', function ($http, $q, apiService, localStorageService) {

    var factory = {};
    factory.getAllCurrencies = async function () {
        let curr = localStorageService.getCurrency();
        let formData = {
            name: curr ? curr.name : "usd"
        }
        let response = await apiService.getMarketPrices(formData);
        localStorageService.setToLocalStorage(response.data);
    }

    return factory;
});