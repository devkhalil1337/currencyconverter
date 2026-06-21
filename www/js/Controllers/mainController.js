angular.module('myApp').controller("mainController", function ($scope, $q, $interval, $rootScope, navigationService,currencyService,localStorageService) {

    function init() {
        applyTheme();
        setAllCurrencies();
        $scope.selectedTab = "settings";
        navigationService.setActiveTemplate($scope.selectedTab);
    }

    const setAllCurrencies = async () => await currencyService.getAllCurrencies();

    function applyTheme() {
        if (localStorageService.getThemeMode() === "dark") {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
        }
    }

    $scope.openPage = function (option) {
        $scope.selectedTab = option;
        navigationService.setActiveTemplate(option);
    };

    $scope.openSidePanel = function () {};
    $scope.closeSidePanel = function () {};


    $scope.$on("$destroy", navigationService.observeActiveTemplateChanged(
        function (val) {
            var activeOptionObj = navigationService.getActiveTemplate();
            $scope.activeOption = activeOptionObj.url;
            $scope.headerText = activeOptionObj.topHeader;
        }
    ));

    init();
});
