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
    function popularSearchs(root, $http, callback) {

        $http.get('/api/event/count/search', {params: {groupby: 'pattern', dossier: currentPage(root)}}).success(function(data) {
            console.log(JSON.stringify(data));
            callback(data);
        });
    }
    function currentPage(root) {
        var m = root.model,
            pgs = m.pages,
            idx = m.selectedIndex;
        return pgs[idx].name || '';
    }
	angular.module('mstr',[
        'ui.bootstrap',
        'ngRoute',
        'ngSanitize',
        'ngAnimate',
        'mstr.view',
        'mstr.xtab',
        'mstr.filter',
        'mstr.mapSelector',
        'mstr.barSelector',
        'mstr.calendar'
    ])
        .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

            $routeProvider.otherwise({redirectTo: '/0'});
        }])

        .controller('NavController', ['$scope', '$rootScope', '$modal', '$http', '$filter', '$location', '$mstrFormat', '$mstrDataTypes', function ($scope, $rootScope, $modal, $http, $filter, $location, $mstrFormat, $mstrDataTypes) {
            this.title = "";

            var openPopup = function (templateUrl, controller) {
                $modal.open({
                    templateUrl: templateUrl,
                    controller: controller,
                    resolve: {
                        $filter: function () {
                            return $filter;
                        },
                        $mstrDataTypes: function () {
                            return $mstrDataTypes;
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

            $rootScope.$watch('suggestions', (function (suggestions) {
                this.suggestions = suggestions;
                this.searchSuggestionIndex = -1;
            }).bind(this));

            this.applySearch = function (search, $event) {

                $rootScope.search = search;
            };

            this.navigateSuggestions = function ($event) {

                switch ($event.keyCode) {
                    case 40:
                        this.searchSuggestionIndex = Math.min(this.suggestions.length - 1, ++this.searchSuggestionIndex);
                        break;
                    case 38:
                        this.searchSuggestionIndex = Math.max(-1, --this.searchSuggestionIndex);
                        break;
                    case 13:
                        if (this.searchSuggestionIndex > -1) {
                            this.setSearch(this.suggestions[this.searchSuggestionIndex].value);
                        }
                        //fall through
                    case 27:
                        $rootScope.suggestions = null;
                        $(':focus').blur();
                }
            };

            this.openIndex = function () {
                openPopup('/templates/table-of-contents.html', 'TableOfContentsCtrl as tableOfContentsCtrl');
            };

            this.openShare = function () {
                openPopup('/templates/share.html', 'ShareCtrl as shareCtrl');
            };

            this.openFilter = function () {
                openPopup('/templates/filter.html', 'FilterCtrl as filterCtrl');
            };

            this.getStyle = function (path) {
                return $mstrFormat.getStyle(path);
            };

            this.onSearchFocus = function () {
                this.searchOnFocus = true;
                this.recentSearches = localStorage.recentSearches;
                $rootScope.suggestions = null;
                var me = this;
                // load aggregated suggestion from server
                popularSearchs($rootScope, $http, function(res) {
                    var list =  [];
                  for (var v in res.result) {
                      list.push({match: v, value: v});
                  }
                    $rootScope.suggestions = list;
                });
                $('.mstr-search').select();
            }

            this.onSearchBlur = function () {

                window.setTimeout((function () {
                    this.searchOnFocus = false;
                    $scope.$apply();
                }).bind(this), 100);
            }

            this.setSearch = function (search) {
                $scope.search = search;
                this.applySearch(search);
            }
        }])

        .controller('PagerCtrl', ['$rootScope', function ($rootScope) {
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
        }])

        .controller('TableOfContentsCtrl', function ($rootScope, $modalInstance) {
            this.model = $rootScope.model;

            this.close = function () {
                $modalInstance.close();
            };
        })

        .controller('ShareCtrl', function ($rootScope, $modalInstance) {
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
        })

        .filter('unique', function () {
            return function (array, index) {
                var output = [],
                    keys = [];

                angular.forEach(array, function (item) {
                    var key = item[index];
                    if (keys.indexOf(key) === -1) {
                        keys.push(key);
                        output.push(item);
                    }
                });

                return output;
            };
        })

        .filter('shortName', function () {
            return function (fullName) {
                return fullName.replace(/^[^ ]+ /, function (firstName) {
                    return firstName.substring(0, 1) + ". ";
                })
            };
        })

        .factory('$mstrFormat', ['$rootScope', '$mstrDataTypes', function ($rootScope, $mstrDataTypes) {

            var formats = {};

            formats[$mstrDataTypes.date] = ["fullDate", "longDate", "mediumDate", "shortDate"];
            formats[$mstrDataTypes.name] = [null, "shortName"];

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
                },

                getNewFormatManager: function () {

                    return (function () {
                        var currentFormats = {};

                        currentFormats[$mstrDataTypes.date] = 0;
                        currentFormats[$mstrDataTypes.name] = 0;

                        return {
                            isLongerFormatAvailable: function (dataType) {
                                var currentFormat = currentFormats[dataType];

                                return currentFormats[dataType] > 0;
                            },

                            isShorterFormatAvailable: function (dataType) {

                                return currentFormats[dataType] < formats[dataType].length - 1;
                            },

                            getShorterFormat: function (dataType) {
                                var currentFormat = currentFormats[dataType] = Math.min(formats[dataType].length - 1, currentFormats[dataType] + 1);

                                return formats[currentFormat];
                            },

                            getLongerFormat: function (dataType) {
                                var currentFormat = currentFormats[dataType] = Math.max (0, currentFormats[dataType] - 1);

                                return formats[dataType][currentFormat];
                            },

                            getDisplayFormat: function (dataType) {

                                return formats[dataType][currentFormats[dataType]];
                            },

                            setShorterFormat: function (dataType) {
                                currentFormats[dataType] = Math.min(formats[dataType].length - 1, currentFormats[dataType] + 1);
                            },

                            setLongerFormat: function (dataType) {
                                currentFormats[dataType] = Math.max (0, currentFormats[dataType] - 1);
                            }
                        };
                    })();
                }
            }
        }])

        .constant('$mstrDataTypes', {
            date: 1,
            geo: {
                state:2
            },
            name: 3,
            text: 4

        })


        .factory('$mstrdata', ['$q', '$http', function ($q, $http) {

            var defer = $q.defer();


            function getCreateTokenURL(connection) {

                var url = [],
                    parameters = [];

                url.push("/data/");
                url.push(connection.dbtype);
                url.push("/getToken?");

                ["server", "port", "database", "user", "password"].forEach(function (param) {
                    parameters.push(param + "=" + connection[param]);
                });

                url.push(parameters.join("&"));

                return url.join("");
            }

            function getFetchURL(connection, table) {

                var url = [];

                url.push("/data/");
                url.push(connection.dbtype);
                url.push("/tables/");
                url.push(table.replace("/redshift/", ""));
                url.push("?token=");
                url.push(connection.token);

                return url.join("");
            }


            function fetchData(connection, table) {

                $http.get(getFetchURL(connection, table)).success(function (data) {
                    defer.resolve(data);
                });
            }

            return {
                fetch: function (page) {

                    var connection = page.connection,
                        token = connection.token;

                    defer = $q.defer();

                    if (!token) {
                        $http.get(getCreateTokenURL(connection)).success(function (data) {

                            connection.token = data.data["connection-token"];
                            fetchData(connection, page.data);
                        });
                    } else {
                        fetchData(connection, page.data);
                    }

                    return defer.promise;
                },

                getDataURL: function (page) {
                    var url = [];

                    url.push("/data/");
                    url.push(page.connection.dbtype);
                    url.push("/tables/");
                    url.push(page.data.replace("/redshift/", ""));

                    return url.join("");
                }

            }
        }]);

})();
