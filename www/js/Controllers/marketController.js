angular.module('myApp').controller("marketController", function ($scope,localStorageService,navigationService) {

    $scope.MarketPrices = {};

    function init() {
        $scope.loadWidget();
    }

    $scope.changePage = () => {
        navigationService.setActiveTemplate("prices");
    }
    $scope.loadWidget = function () {
        let symbol = localStorageService.getCoinTradeView();
        console.log(symbol);
        const tradingView = new TradingView.widget({
            'width': '200',
            'height': '500',
            'container_id': 'technical-analysis',
            'autosize': true,
            'symbol': symbol,
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