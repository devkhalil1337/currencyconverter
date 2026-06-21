angular.module('myApp').controller("favCurrenciesController", function ($scope, $q, $interval, $rootScope, navigationService,apiService,localStorageService,currencyService) {

    let MarketPrices = localStorageService.geAllCurrenciesFromLocalStorage();
    $scope.totalDisplayed = 20;
    $scope.selectedCoin = {};
    $scope.cryptoAlertTarget = "";
    async function init() {
        setAllCurrencies();
        MarketPrices = localStorageService.geAllCurrenciesFromLocalStorage();
    }


    $scope.loadMore = () =>  $scope.totalDisplayed += 20;


    const setAllCurrencies = async () => await currencyService.getAllCurrencies();

    function getTradingViewSymbol(coinObj) {
        var symbol = (coinObj && coinObj.symbol ? coinObj.symbol : "").toString().toUpperCase();
        if (!symbol) {
            return "";
        }
        return "BINANCE:" + symbol + "USDT";
    }

    function clearTradingViewContainer() {
        var container = document.getElementById("technical-analysis");
        if (container) {
            container.innerHTML = "";
        }
    }

    $scope.getCurrencies = function(){
        let _favCurr = localStorageService.getFavCurrency();
        if(!_favCurr)
            _favCurr = [];
        
            MarketPrices.forEach(elm => {
                if(_favCurr.some(favCur => favCur == elm.id)){
                    elm.isFav = true;
                }
            });
            return MarketPrices;
    }



    $scope.addToFav = function(id){
        const isCurrExists = localStorageService.isFavCurrAlreadyAdded(id);
        if(isCurrExists){
            localStorageService.removeFavCurr(id);
            MarketPrices.filter(cur => 
                { 
                if(cur.id == id)
                    cur.isFav = false;
            });
            return;
        }
        localStorageService.setFavCurrency(id);
    }


    $scope.loadWidget =  coinObj =>  {
        $scope.selectedCoin = coinObj;
        $scope.cryptoAlertTarget = "";
        clearTradingViewContainer();
        const tradingView = new TradingView.widget({
            'width': '200',
            'height': '500',
            'container_id': 'technical-analysis',
            'autosize': true,
            'symbol': getTradingViewSymbol(coinObj),
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

    $scope.addCryptoAlert = function () {
        var targetPrice = parseFloat($scope.cryptoAlertTarget);
        if (!$scope.selectedCoin || !$scope.selectedCoin.id || isNaN(targetPrice) || targetPrice <= 0) {
            return;
        }
        var alerts = localStorageService.getRateAlerts();
        alerts.unshift({
            id: Date.now(),
            type: "crypto",
            coinId: $scope.selectedCoin.id,
            coinName: $scope.selectedCoin.name,
            symbol: $scope.selectedCoin.symbol,
            targetRate: targetPrice,
            currentRate: parseFloat($scope.selectedCoin.current_price) || 0,
            createdAt: Date.now()
        });
        alerts = alerts.slice(0, 12);
        localStorageService.setRateAlerts(alerts);
        $scope.cryptoAlertTarget = "";
    }


    init();
});
