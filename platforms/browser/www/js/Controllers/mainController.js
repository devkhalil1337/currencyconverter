angular.module('myApp').controller("mainController", function ($scope, $q, $interval, $rootScope, navigationService,currencyService) {

    function init() {
        setAllCurrencies();
        $scope.selectedTab = "settings"
        console.log("I am init function of mainController");
        navigationService.setActiveTemplate($scope.selectedTab);
    }


    const setAllCurrencies = async () => await currencyService.getAllCurrencies();

    $scope.openPage = function (option) {
        $scope.selectedTab = option;
        navigationService.setActiveTemplate(option);
        $scope.closeSidePanel();
    }

    $scope.openSidePanel = function(){
        $('#sidebarleft').addClass('active'); 
    }
    
    $scope.closeSidePanel = function(){
        $('#sidebarleft').removeClass('active');
        $('#sidebarright').removeClass('active');
        $('.overlay').removeClass('active'); 
        $('body').removeClass('noscroll');
    }


    $scope.$on("$destroy", navigationService.observeActiveTemplateChanged(
        function (val) {
            var activeOptionObj = navigationService.getActiveTemplate();
            $scope.activeOption = activeOptionObj.url;
            $scope.headerText = activeOptionObj.topHeader;
        }
    ));

    init();
});