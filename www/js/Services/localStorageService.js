angular.module('myApp').factory('localStorageService', function () {


    let _setCurrency = curr =>  localStorage.setItem("curr",JSON.stringify(curr));
    let _getCurrency = () => JSON.parse(localStorage.getItem("curr"));

    let _getFavCurrency = () => JSON.parse(localStorage.getItem("favCurr"));

    let _setFavCurrency = id => 
    {  
        let favCurrList = _getFavCurrency();
        if(!favCurrList)
            favCurrList = [];
            if(favCurrList.length == 0 || !favCurrList.some(elm => elm == id)){
                favCurrList.push(id)
            }
            localStorage.setItem("favCurr",JSON.stringify(favCurrList))
    };

    let _removeFavCurr = id => {
        let favVurList = _getFavCurrency();
        favVurList = favVurList ? favVurList : [];
        favVurList = favVurList.filter(cur => cur != id);
        localStorage.setItem("favCurr",JSON.stringify(favVurList))
    }

    let _isFavCurrAlreadyAdded = id => {
        let favVurList = _getFavCurrency();
        favVurList = favVurList ? favVurList : [];
        return favVurList.some(cur => cur == id);
    }

    const _setToLocalStorage = currencies => localStorage.setItem("allCurrencies",JSON.stringify(currencies))
    const _geAllCurrenciesFromLocalStorage = () => JSON.parse(localStorage.getItem("allCurrencies"));
    const _getConverterHistory = () => JSON.parse(localStorage.getItem("converterHistory")) || [];
    const _setConverterHistory = history => localStorage.setItem("converterHistory", JSON.stringify(history || []));
    const _getFavoritePairs = () => JSON.parse(localStorage.getItem("favoritePairs")) || [];
    const _setFavoritePairs = pairs => localStorage.setItem("favoritePairs", JSON.stringify(pairs || []));
    const _getCachedUsdRates = () => JSON.parse(localStorage.getItem("cachedUsdRates"));
    const _setCachedUsdRates = rates => localStorage.setItem("cachedUsdRates", JSON.stringify(rates));
    const _getRateAlerts = () => JSON.parse(localStorage.getItem("rateAlerts")) || [];
    const _setRateAlerts = alerts => localStorage.setItem("rateAlerts", JSON.stringify(alerts || []));
    const _getPortfolioHoldings = () => JSON.parse(localStorage.getItem("portfolioHoldings")) || [];
    const _setPortfolioHoldings = holdings => localStorage.setItem("portfolioHoldings", JSON.stringify(holdings || []));
    const _getThemeMode = () => localStorage.getItem("themeMode") || "light";
    const _setThemeMode = mode => localStorage.setItem("themeMode", mode || "light");
    const _getComparisonCurrencies = () => JSON.parse(localStorage.getItem("comparisonCurrencies")) || ["eur", "gbp", "aed"];
    const _setComparisonCurrencies = codes => localStorage.setItem("comparisonCurrencies", JSON.stringify(codes || []));

    return{
        setCurrency:_setCurrency,
        getCurrency:_getCurrency,
        setFavCurrency:_setFavCurrency,
        getFavCurrency:_getFavCurrency,
        isFavCurrAlreadyAdded: _isFavCurrAlreadyAdded,
        removeFavCurr:_removeFavCurr,
        setToLocalStorage: _setToLocalStorage,
        geAllCurrenciesFromLocalStorage:_geAllCurrenciesFromLocalStorage,
        getConverterHistory: _getConverterHistory,
        setConverterHistory: _setConverterHistory,
        getFavoritePairs: _getFavoritePairs,
        setFavoritePairs: _setFavoritePairs,
        getCachedUsdRates: _getCachedUsdRates,
        setCachedUsdRates: _setCachedUsdRates,
        getRateAlerts: _getRateAlerts,
        setRateAlerts: _setRateAlerts,
        getPortfolioHoldings: _getPortfolioHoldings,
        setPortfolioHoldings: _setPortfolioHoldings,
        getThemeMode: _getThemeMode,
        setThemeMode: _setThemeMode,
        getComparisonCurrencies: _getComparisonCurrencies,
        setComparisonCurrencies: _setComparisonCurrencies

    }

});
