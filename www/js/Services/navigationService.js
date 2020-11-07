angular.module('myApp').factory('navigationService', function (detachedScope) {

    var activeTemplateName = "converter";
    var internalScope = detachedScope.$new();

    var allTemplates = [];
    allTemplates["converter"] = { url: "html/converter.html", topHeader: "Converter" };
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