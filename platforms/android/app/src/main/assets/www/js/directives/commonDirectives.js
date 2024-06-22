angular.module('myApp').directive('onScrollToBottom',['$document', function($document) {
	//This function will fire an event when the container/document is scrolled to the bottom of the page
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var doc = angular.element($document)[0].body;
			$document.bind("scroll", function() {
				if(doc.scrollTop + doc.offsetHeight >= doc.scrollHeight) {
					scope.$apply(attrs.onScrollToBottom);
				}
			});
		}
	};
}])