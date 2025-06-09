angular.module('myApp').controller("converterController", function ($scope, $q, $interval, $rootScope, navigationService, apiService, localStorageService) {

    $scope.Currobject = {}
    $scope.currencies = [...allcurrencies, ...localStorageService.geAllCurrenciesFromLocalStorage()];
    // let MarketPrices = ;
    function init() {
        $scope.Currobject.selectedFromCurr = allcurrencies[0];
        $scope.Currobject.selectedToCurr = allcurrencies[1];
        console.log($scope.currencies)
    }

    $scope.getAllSupportedCurrencies = async function () {
        try {
            let response = await apiService.getAllSupportedCurrencies();
            let fullresp = await apiService.getAllSupportedCurrenciesFullName();
            $scope.currencies = response.data;
            let filtered = fullresp.data.filter(c => {
                return ($scope.currencies.some(f => f == c.symbol))
            })
            console.log(filtered);
            $scope.Currobject.selectedFromCurr = $scope.currencies[0];
            $scope.Currobject.selectedToCurr = $scope.currencies[1];
            $scope.$apply();
        } catch (error) {
            console.log(error);
        }
    }

    $scope.convert = async function () {
        let selectedFromCoinId = $scope.Currobject.selectedFromCurr.id.toLowerCase()
        let selectedToCoinId = $scope.Currobject.selectedToCurr.symbol.toLowerCase()
        try {
            let formData = {
                selectedFromCurr: selectedFromCoinId,
                selectedToCurr: selectedToCoinId
            }
            let response = await apiService.getCurrenciesPrice(formData)
            $scope.Currobject.toCurrency = response.data && response.data[selectedFromCoinId] && response.data[selectedFromCoinId][selectedToCoinId] || 0;
            $scope.Currobject.toCurrency = $scope.Currobject.toCurrency ? ($scope.Currobject.toCurrency * $scope.Currobject.fromCurrency) : 0;
            $scope.$apply();
        } catch (error) {
            $scope.Currobject.toCurrency = 0;
            console.log(error);
        }

    }


    init();
});