angular.module('myApp').factory('localStorageService', function () {




    function _setCurrency(curr){
        localStorage.setItem("curr",JSON.stringify(curr));
    }

    function _getCurrency(){
      return  JSON.parse(localStorage.getItem("curr"));
    }

    return{
        setCurrency:_setCurrency,
        getCurrency:_getCurrency
    }


});
