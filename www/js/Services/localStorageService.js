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

    return{
        setCurrency:_setCurrency,
        getCurrency:_getCurrency,
        setFavCurrency:_setFavCurrency,
        getFavCurrency:_getFavCurrency,
        isFavCurrAlreadyAdded: _isFavCurrAlreadyAdded,
        removeFavCurr:_removeFavCurr,
        setToLocalStorage: _setToLocalStorage,
        geAllCurrenciesFromLocalStorage:_geAllCurrenciesFromLocalStorage

    }

});
