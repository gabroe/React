'use strict';

(function () {

    function getDataURL($location) {

        var url = /\/[^\/]*\#/.exec($location.absUrl()),
            result = "/api/dossiers/";

        if (url.length) {

            return result + url[0].replace(/[\/\#]/g, "");
        }
        return result;
    }

    function trackEvent($http, msg) {
        $http.get('/api/logEvent', {params: {msg: msg}}).success(function(data) {
            console.log(JSON.stringify(data));
        });
    }

    var app = angular.module('mstr', [
        'ui.bootstrap',
        'ngRoute',
        'ngAnimate',
        'mstr.view',
        'mstr.xtab',
        'mstr.filter',
        'mstr.mapSelector',
        'mstr.barSelector',
        'mstr.calendar'
    ]);

    app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

        $routeProvider.otherwise({redirectTo: '/0'});
    }]);

    app.controller('NavController', ['$rootScope', '$modal', '$http', '$filter', '$location', '$mstrFormat', function ($rootScope, $modal, $http, $filter, $location, $mstrFormat) {
        this.title = "";

        var openPopup = function (templateUrl, controller) {
                $modal.open({
                    templateUrl: templateUrl,
                    controller: controller,
                    resolve: {
                        $filter: function () {
                            return $filter;
                        }
                    }
                });
            };

        $http.get(getDataURL($location)).success(function (data) {


            if (Array.isArray(data)) {
                $rootScope.model = data[0];
            } else {
                $rootScope.model = data;
            }

        }).error(function (data) {
            $rootScope.model = {};
        });

        $rootScope.$watch('model.selectedIndex', (function (selectedIndex) {
            if (selectedIndex !== undefined) {
                this.title = $rootScope.model.pages[selectedIndex].name;
            }
        }).bind(this));

        this.applySearch = function (search) {
            $rootScope.search = search;
            // event tracking
            trackEvent($http, {action: 'search', pattern: search});
        }

        this.openIndex = function () {
            openPopup('/templates/table-of-contents.html', 'TableOfContentsCtrl as tableOfContentsCtrl');
        };

        this.openShare = function () {
            openPopup('/templates/share.html', 'ShareCtrl as shareCtrl');
        };

        this.openFilter = function () {
            openPopup('/templates/filter.html', 'FilterCtrl as filterCtrl');
        };

        this.getStyle = function(path) {
            return $mstrFormat.getStyle(path);
        }

    }]);

    app.controller('PagerCtrl', ['$rootScope', function ($rootScope) {
        this.pages = [];
        this.selectedIndex = 0;

        $rootScope.$watch('model.selectedIndex', (function (selectedIndex) {
            if (selectedIndex !== undefined) {
                this.selectedIndex = selectedIndex;
            }
        }).bind(this));

        $rootScope.$watch('model', (function (model) {
            if (model) {
                this.pages = model.pages;
            }
        }).bind(this));
    }]);

    app.controller('TableOfContentsCtrl', function ($rootScope, $modalInstance) {
        this.model = $rootScope.model;

        this.close = function () {
            $modalInstance.close();
        };
    });

    app.controller('ShareCtrl', function ($rootScope, $modalInstance) {
        this.model = $rootScope.model;

        this.share = function (media) {
            switch (media) {
                case 'facebook':
                    window.open("https://www.facebook.com/sharer/sharer.php?u=" + window.location, "_blank");
                    break;
                case 'email':
                    window.location = "mailto:?subject=" + encodeURIComponent("MicroStrategy Dossier - " + this.model.name) + "&body=" + encodeURIComponent("\nA MicroStrategy Dossier \"" + this.model.name + "\” was shared with you: ") + window.location;
            }
            this.close();
        }

        this.close = function () {
            $modalInstance.close();
        };
    });

    app.filter('unique', function() {
        return function(array, index) {
            var output = [],
                keys = [];

            angular.forEach(array, function(item) {
                var key = item[index];
                if(keys.indexOf(key) === -1) {
                    keys.push(key);
                    output.push(item);
                }
            });

            return output;
        };
    });

    app.factory('$mstrFormat', ['$rootScope', function ($rootScope) {
        return {
            getStyle: function (path) {
                var model = $rootScope.model,
                    styleDefinition = model && model.style,
                    pathArray = path.split(".");


                if (styleDefinition) {
                    pathArray.forEach(function (token) {
                        styleDefinition = styleDefinition[token];
                    });

                    return styleDefinition;
                }
                return {};
            }
        }
    }]);
})();
