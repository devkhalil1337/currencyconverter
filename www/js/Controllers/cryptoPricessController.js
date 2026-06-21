angular.module('myApp').controller("cryptoPricessController", function ($scope, $q, $interval, $rootScope, navigationService, apiService, localStorageService, currencyService) {

    let MarketPrices = localStorageService.geAllCurrenciesFromLocalStorage();
    $scope.totalDisplayed = 20;
    $scope.selectedCoin = {};
    $scope.cryptoAlertTarget = "";
    $scope.priceFilter = "rank";
    $scope.holdingAmount = "";
    $scope.marketLoading = false;
    $scope.marketError = "";

    async function init() {
        await $scope.refreshMarketPrices();
        initializeWebSocket();
    }

    $scope.loadMore = () => $scope.totalDisplayed += 20;

    const setAllCurrencies = async () => await currencyService.getAllCurrencies();

    $scope.refreshMarketPrices = async function () {
        $scope.marketLoading = true;
        $scope.marketError = "";
        try {
            await setAllCurrencies();
            MarketPrices = localStorageService.geAllCurrenciesFromLocalStorage() || [];
        } catch (err) {
            console.log(err);
            MarketPrices = localStorageService.geAllCurrenciesFromLocalStorage() || [];
            $scope.marketError = MarketPrices.length
                ? "Fresh prices failed. Showing saved data."
                : "Could not load market prices.";
        } finally {
            $scope.marketLoading = false;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }
    }

    function applyFavoriteFlags(currencies) {
        let _favCurr = localStorageService.getFavCurrency();
        if (!_favCurr) _favCurr = [];

        currencies.forEach(elm => {
            elm.isFav = _favCurr.some(favCur => favCur == elm.id);
        });
        return currencies;
    }

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

    $scope.getCurrencies = function () {
        return applyFavoriteFlags(MarketPrices || []);
    }

    $scope.setPriceFilter = function (filterName) {
        $scope.priceFilter = filterName;
    }

    $scope.getFilteredCurrencies = function () {
        var list = $scope.getCurrencies().slice();
        var query = ($scope.Search || "").toLowerCase().trim();
        if (query) {
            list = list.filter(function (price) {
                return (price.name || "").toLowerCase().indexOf(query) !== -1
                    || (price.symbol || "").toLowerCase().indexOf(query) !== -1;
            });
        }
        if ($scope.priceFilter === "favorites") {
            list = list.filter(function (price) { return price.isFav; });
        }
        if ($scope.priceFilter === "gainers") {
            list.sort(function (a, b) {
                return (b.market_cap_change_percentage_24h || 0) - (a.market_cap_change_percentage_24h || 0);
            });
        } else if ($scope.priceFilter === "losers") {
            list.sort(function (a, b) {
                return (a.market_cap_change_percentage_24h || 0) - (b.market_cap_change_percentage_24h || 0);
            });
        } else {
            list.sort(function (a, b) {
                return (a.market_cap_rank || 999999) - (b.market_cap_rank || 999999);
            });
        }
        return list;
    }

    function findMarketPrice(coinId) {
        var prices = MarketPrices || [];
        for (var i = 0; i < prices.length; i++) {
            if (prices[i].id === coinId) {
                return prices[i];
            }
        }
        return null;
    }

    $scope.getPortfolioRows = function () {
        return localStorageService.getPortfolioHoldings().map(function (holding) {
            var market = findMarketPrice(holding.coinId) || {};
            var price = parseFloat(market.current_price) || 0;
            return {
                coinId: holding.coinId,
                coinName: holding.coinName,
                symbol: holding.symbol,
                amount: holding.amount,
                price: price,
                value: holding.amount * price
            };
        });
    }

    $scope.getPortfolioTotal = function () {
        return $scope.getPortfolioRows().reduce(function (total, row) {
            return total + row.value;
        }, 0);
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
        $scope.cryptoAlertTarget = "";
        var savedHolding = localStorageService.getPortfolioHoldings().filter(function (holding) {
            return holding.coinId === coinObj.id;
        })[0];
        $scope.holdingAmount = savedHolding ? savedHolding.amount : "";
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

    $scope.saveHolding = function () {
        var amount = parseFloat($scope.holdingAmount);
        if (!$scope.selectedCoin || !$scope.selectedCoin.id || isNaN(amount) || amount < 0) {
            return;
        }
        var holdings = localStorageService.getPortfolioHoldings().filter(function (holding) {
            return holding.coinId !== $scope.selectedCoin.id;
        });
        if (amount > 0) {
            holdings.unshift({
                coinId: $scope.selectedCoin.id,
                coinName: $scope.selectedCoin.name,
                symbol: $scope.selectedCoin.symbol,
                amount: amount
            });
        }
        localStorageService.setPortfolioHoldings(holdings);
    }

    $scope.removeHolding = function (coinId) {
        var holdings = localStorageService.getPortfolioHoldings().filter(function (holding) {
            return holding.coinId !== coinId;
        });
        localStorageService.setPortfolioHoldings(holdings);
    }

    function initializeWebSocket() {
        if (!MarketPrices || !MarketPrices.length) {
            return;
        }
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
