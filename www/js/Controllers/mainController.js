angular.module('myApp').controller("mainController", function ($scope, $q, $interval, $rootScope, navigationService) {

    function init() {
        $scope.selectedTab = "converter"
        console.log("I am init function of mainController");
        navigationService.setActiveTemplate($scope.selectedTab);
    }


    $scope.openPage = function (option) {
        $scope.selectedTab = option;
        navigationService.setActiveTemplate(option);
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