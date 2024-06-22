angular.module('myApp').controller("cryptoPricessController", function ($scope, $q, $interval, $rootScope, navigationService, apiService, localStorageService, currencyService) {

    let MarketPrices = localStorageService.geAllCurrenciesFromLocalStorage();
    $scope.totalDisplayed = 20;
    $scope.selectedCoin = {};

    async function init() {
        setAllCurrencies();
        MarketPrices = localStorageService.geAllCurrenciesFromLocalStorage();
        initializeWebSocket();
    }

    $scope.loadMore = () => $scope.totalDisplayed += 20;

    const setAllCurrencies = async () => await currencyService.getAllCurrencies();

    $scope.getCurrencies = function () {
        let _favCurr = localStorageService.getFavCurrency();
        if (!_favCurr) _favCurr = [];

        MarketPrices.forEach(elm => {
            if (_favCurr.some(favCur => favCur == elm.id)) {
                elm.isFav = true;
            }
        });
        return MarketPrices;
    }

    $scope.addToFav = function (id) {
        const isCurrExists = localStorageService.isFavCurrAlreadyAdded(id);
        if (isCurrExists) {
            localStorageService.removeFavCurr(id);
            MarketPrices.filter(cur => {
                if (cur.id == id) cur.isFav = false;
            });
            return;
        }
        localStorageService.setFavCurrency(id);
    }

    $scope.loadWidget = coinObj => {
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

    function initializeWebSocket() {
        const currencies = MarketPrices.map(cur => cur.id);
        //        debugger
        const socket = new WebSocket(`wss://ws.coincap.io/prices?assets=ALL`);
        socket.addEventListener('message', function (event) {
            const data = JSON.parse(event.data);
            console.log({ data })
            updatePrices(data);
        });
    }

    function updatePrices(data) {
        Object.keys(data).forEach(symbol => {
            MarketPrices.forEach(currency => {
                if (currency.id === symbol) {
                    currency.current_price = data[symbol];
                    $scope.$apply(); // Apply the scope changes
                }
            });
        });
    }

    init();
});
