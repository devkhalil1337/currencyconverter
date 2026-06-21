angular.module('myApp').controller("settingsController", function ($scope, $q, $interval, $rootScope, navigationService,apiService,localStorageService) {

    $scope.supportedCurrencies = 
    [
        {
            id:1,
            name:"USD"
        },
        {
            id:2,
            name:"EUR"
        },
        {
            id:3,
            name:"PKR"
        },
        {
            id:4,
            name:"INR"
        },
        {
            id:4,
            name:"GBP"
        }

    ]

    
    function init() {
        console.log("I am setting controller");

        $scope.getCurrency();
        $scope.themeMode = localStorageService.getThemeMode();
        applyTheme();
    }

    $scope.getCurrency = function(){
        let curr = localStorageService.getCurrency();
        if(!curr){
            $scope.selectedCurr = $scope.supportedCurrencies[0]; 
            return;
        }
        $scope.selectedCurr = $scope.supportedCurrencies.filter(cr => (cr.id == curr.id))[0];
        
    }

    $scope.setCurrency = function(curr){
        localStorageService.setCurrency($scope.selectedCurr);
    }

    $scope.getLastConversion = function () {
        return localStorageService.getConverterHistory()[0];
    }

    $scope.getFavoritePairCount = function () {
        return localStorageService.getFavoritePairs().length;
    }

    $scope.getPortfolioTotal = function () {
        var prices = localStorageService.geAllCurrenciesFromLocalStorage() || [];
        return localStorageService.getPortfolioHoldings().reduce(function (total, holding) {
            var market = prices.filter(function (price) {
                return price.id === holding.coinId;
            })[0];
            return total + ((parseFloat(market && market.current_price) || 0) * holding.amount);
        }, 0);
    }

    $scope.getTopMover = function () {
        var prices = (localStorageService.geAllCurrenciesFromLocalStorage() || []).slice();
        prices.sort(function (a, b) {
            return (b.market_cap_change_percentage_24h || 0) - (a.market_cap_change_percentage_24h || 0);
        });
        return prices[0];
    }

    function applyTheme() {
        if ($scope.themeMode === "dark") {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
        }
    }

    $scope.toggleTheme = function () {
        $scope.themeMode = $scope.themeMode === "dark" ? "light" : "dark";
        localStorageService.setThemeMode($scope.themeMode);
        applyTheme();
    }


    init();
});
