document.addEventListener("DOMContentLoaded", function onDeviceReady() {

    console.log("device ready event triggered....");
    angular.bootstrap(document, ['myApp']);

    console.log("device ready event completed....");
}, false);


angular.module('myApp', ['ngRoute'])
    .config(function ($routeProvider, $locationProvider) {
//        $locationProvider.html5Mode(true);
        $routeProvider
            .when('/', {
                templateUrl: 'html/main.html', controller: 'mainController'
            })
            .otherwise({ redirectTo: "/" });
    })
    .factory("detachedScope", function ($rootScope) {
        return {
            $new: function () {
                var internalScope = $rootScope.$new(true, {});
                var oldOn = internalScope.$on;
                internalScope.$on = function (name, fn) {
                    return oldOn.call(internalScope, name, function (e, val) {
                        fn(e, val);
                        // stop event from leaking to $rootScope
                        e.stopPropagation();
                    });
                };
                return internalScope;
            }
        }
    });
