angular.module('myApp').controller("settingsController", function ($scope, $q, $interval, $rootScope, navigationService,apiService,localStorageService) {

    $scope.supportedCurrencies = 
    [
        {
            id:1,
            name:"USD"
        },
        {
            id:2,
            name:"EUR"
        },
        {
            id:3,
            name:"PKR"
        },
        {
            id:4,
            name:"INR"
        }

    ]

    
    function init() {
        console.log("I am setting controller");

        $scope.getCurrency();
    }

    $scope.getCurrency = function(){
        let curr = localStorageService.getCurrency();
        if(!curr){
            $scope.selectedCurr = $scope.supportedCurrencies[0]; 
            return;
        }
        $scope.selectedCurr = $scope.supportedCurrencies.filter(cr => (cr.id == curr.id))[0];
        
    }

    $scope.setCurrency = function(curr){
        localStorageService.setCurrency($scope.selectedCurr);
    }


    init();
});