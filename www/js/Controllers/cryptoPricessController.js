angular.module('myApp').controller("cryptoPricessController", function ($scope, $q, $interval, $rootScope, navigationService,apiService,localStorageService) {

    $scope.MarketPrices = {};
    $scope.totalDisplayed = 20;

    function init() {
        console.log("I am crypto");
        $scope.getAllCoinsPrices();
    }


    $scope.loadMore = () =>  $scope.totalDisplayed += 20;

    $scope.getAllCoinsPrices = async function(){
        let curr = localStorageService.getCurrency();
        let formData = {
            name:curr ? curr.name : "usd"
        }
        $scope.Currency = formData;
        try{
            let response = await apiService.getMarketPrices(formData);
            $scope.MarketPrices = response.data;
            $scope.$apply();
        }catch(error){
            console.log(error);
        }
    }

    $scope.getCoin = coinObj => {
        localStorageService.setCoinTradeView(coinObj.symbol);
    }


    init();
});