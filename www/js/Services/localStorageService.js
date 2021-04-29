angular.module('myApp').factory('localStorageService', function () {


    let _setCurrency = curr =>  localStorage.setItem("curr",JSON.stringify(curr));
    let _getCurrency = () => JSON.parse(localStorage.getItem("curr"));

    return{
        setCurrency:_setCurrency,
        getCurrency:_getCurrency,

    }

});
