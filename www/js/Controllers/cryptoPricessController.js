angular.module('myApp').controller("cryptoPricessController", function ($scope, $q, $interval, $rootScope, navigationService,apiService,localStorageService) {

    $scope.MarketPrices = {};
    $scope.totalDisplayed = 20;
    $scope.selectedCoin = {};
    function init() {
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


    $scope.loadWidget =  coinObj =>  {
        $scope.selectedCoin = coinObj;
        const tradingView = new TradingView.widget({
            'width': '200',
            'height': '500',
            'container_id': 'technical-analysis',
            'autosize': true,
            'symbol': coinObj.symbol,
            'interval': 'D',
            'timezone': 'Etc/UTC',
            'theme': 'Light',
            'style': '1',
            'locale': 'en',
            'toolbar_bg': '#f1f3f6',
            'enabling_publishing': false,
            'withdateranges': true,
            'hide_side_toolbar': false,
            'allow_symbol_change': true,
            'save_image': false,
            'hideideas': true
        });
    }


    init();
});