angular.module('myApp').factory('navigationService', function (detachedScope) {

    var activeTemplateName = "converter";
    var internalScope = detachedScope.$new();

    var allTemplates = [];
    allTemplates["converter"] = { url: "html/converter.html", topHeader: "Converter" };
    allTemplates["settings"] = { url: "html/settings.html", topHeader: "Settings" };
    allTemplates["prices"] = { url: "html/cryptoPrices.html", topHeader: "Crypto Prices" };
    allTemplates["marketprice"] = { url: "html/markets.html", topHeader: "Markets Price" };
    return {

        getActiveTemplate: function () {
            return allTemplates[activeTemplateName];
        },

        setActiveTemplate: function (newActiveTemplateName, data) {
            if (data) {
                allTemplates[newActiveTemplateName].data = data;
            }
            activeTemplateName = newActiveTemplateName;
            internalScope.$emit("activeTemplateChange")

        },

        observeActiveTemplateChanged: function (fn) {
            return internalScope.$on("activeTemplateChange", function (e, val) {
                fn(val);
            });
        }
    }
});