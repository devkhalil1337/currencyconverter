angular.module('myApp').factory('localStorageService', function () {




    function _setCurrency(curr){
        localStorage.setItem("curr",JSON.stringify(curr));
    }

    function _getCurrency(){
      return  JSON.parse(localStorage.getItem("curr"));
    }

    const _setCoinTradeView = coinSymbol => localStorage.setItem("setCoinTradeView",coinSymbol);
    const _getCoinTradeView = () => localStorage.getItem("setCoinTradeView");
    return{
        setCurrency:_setCurrency,
        getCurrency:_getCurrency,
        setCoinTradeView:_setCoinTradeView,
        getCoinTradeView:_getCoinTradeView

    }


});
