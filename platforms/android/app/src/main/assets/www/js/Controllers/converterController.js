angular.module('myApp').controller("converterController", function ($scope, $q, $interval, $rootScope, navigationService, apiService, localStorageService) {

    $scope.Currobject = {}
    $scope.currencies = [...allcurrencies, ...localStorageService.geAllCurrenciesFromLocalStorage()];
    // let MarketPrices = ;
    function init() {
        $scope.Currobject.selectedFromCurr = allcurrencies[0];
        $scope.Currobject.selectedToCurr = allcurrencies[1];
        $scope.Currobject.fromCurrency = 1; // Initialize with a value
        console.log($scope.currencies)
        $scope.convert(); // Trigger initial conversion
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

    $scope.swapCurrencies = function () {
        // Swap Currency Objects
        let tempCurr = $scope.Currobject.selectedFromCurr;
        $scope.Currobject.selectedFromCurr = $scope.Currobject.selectedToCurr;
        $scope.Currobject.selectedToCurr = tempCurr;

        // Swap Amounts (Optional: usually users want to see the reverse rate of the same amount,
        // but if they want to "flip" the entire state including values, we swap values too.
        // Based on "swipe nahi ho rahi" implying visually nothing happens or values don't move:

        let tempAmount = $scope.Currobject.fromCurrency;
        $scope.Currobject.fromCurrency = $scope.Currobject.toCurrency;
        $scope.Currobject.toCurrency = tempAmount;

        // Re-trigger convert to get exact fresh rate for the new direction
        // $scope.convert();
        // Actually, if we just swapped values, they might already be correct roughly.
        // But to ensure strict accuracy with the new pair's rate:
        $scope.convert();
    };

    $scope.convert = async function () {
        if (!$scope.Currobject.fromCurrency) {
            $scope.Currobject.toCurrency = 0;
            return;
        }

        let selectedFromCoinId = $scope.Currobject.selectedFromCurr.id.toLowerCase()
        let selectedToCoinId = $scope.Currobject.selectedToCurr.symbol.toLowerCase()
        try {
            let formData = {
                selectedFromCurr: selectedFromCoinId,
                selectedToCurr: selectedToCoinId
            }
            let response = await apiService.getCurrenciesPrice(formData)
            let rate = response.data && response.data[selectedFromCoinId] && response.data[selectedFromCoinId][selectedToCoinId] || 0;

            $scope.Currobject.toCurrency = rate * $scope.Currobject.fromCurrency;
            $scope.$apply();
        } catch (error) {
            // $scope.Currobject.toCurrency = 0; // Dont reset on weak error
            console.log(error);
        }
    }

    $scope.convertReverse = async function () {
        if (!$scope.Currobject.toCurrency) {
            $scope.Currobject.fromCurrency = 0;
            return;
        }

        // To convert reverse, we treat "To" as "From" and "From" as "To" logic-wise
        let selectedFromCoinId = $scope.Currobject.selectedToCurr.id.toLowerCase() // "To" coin ID
        let selectedToCoinId = $scope.Currobject.selectedFromCurr.symbol.toLowerCase() // "From" symbol (destination)

        try {
            // In many APIs, you might need to query the reverse pair or invert the rate.
            // Assuming apiService.getCurrenciesPrice can handle any pair:
            let formData = {
                selectedFromCurr: selectedFromCoinId,
                selectedToCurr: selectedToCoinId
            }
            let response = await apiService.getCurrenciesPrice(formData)
            let rate = response.data && response.data[selectedFromCoinId] && response.data[selectedFromCoinId][selectedToCoinId] || 0;

            $scope.Currobject.fromCurrency = rate * $scope.Currobject.toCurrency;
            $scope.$apply();
        } catch (error) {
            console.log(error);
        }
    }

    $scope.convertCustom = async function () {
        if (!$scope.Currobject.customValue) {
            $scope.Currobject.customConvertedValue = 0;
            return;
        }

        // Use the existing logic to get rate, but apply to customValue
        let selectedFromCoinId = $scope.Currobject.selectedFromCurr.id.toLowerCase();
        let selectedToCoinId = $scope.Currobject.selectedToCurr.symbol.toLowerCase();

        try {
            // We can reuse the rate if already fetched, or fetch again to be safe.
            // For now, let's fetch to ensure accuracy if they changed selection without converting.
            // Optimization: store 'currentRate' in scope to avoid extra API calls.
            let formData = {
                selectedFromCurr: selectedFromCoinId,
                selectedToCurr: selectedToCoinId
            }
            let response = await apiService.getCurrenciesPrice(formData);
            let rate = response.data && response.data[selectedFromCoinId] && response.data[selectedFromCoinId][selectedToCoinId] || 0;

            $scope.Currobject.customConvertedValue = $scope.Currobject.customValue * rate;
            $scope.$apply(); // Ensure UI updates
        } catch (error) {
            console.log(error);
        }
    };


    init();
});