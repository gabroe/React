'use strict';

(function () {

    var PAGE_SIZE = 100,
        timeout;

    angular.module('mstr.xtab', [])

        .factory('$chunkLoader', ['$q', function ($q) {

            var chunkLoaderWorker = new Worker("/javascripts/mstr-data-chunk-loader.js"),
                defer = $q.defer();

            chunkLoaderWorker.addEventListener('message', function (e) {

                defer.resolve(e.data);
            });

            return {
                fetch: function (request) {
                    defer = $q.defer();
                    chunkLoaderWorker.postMessage(request);
                    return defer.promise;
                }
            }
        }])

        .controller('xTabController', ['$scope', '$rootScope', '$http', '$filter', '$chunkLoader', function ($scope, $rootScope, $http, $filter, $chunkLoader) {
            var sortOrder = false,
                watchers = [];

            this.fullmodel = {};

            this.sort = -1;

            this.click = function () {
                var evt = window.event,
                    evtSource = evt && evt.toElement,
                    i;

                if (evtSource.tagName == 'TH') {
                    var ths = evtSource.parentNode.childNodes;

                    angular.forEach(ths, function (th) {
                        $(th).removeClass("sorted");
                    });

                    this.applySort(evtSource.cellIndex);
                }
            };

            this.applySort = function (sortKey, model) {

                if (this.sort === sortKey) {
                    sortOrder = !sortOrder;
                } else if (sortKey !== -1) {
                    this.sort = sortKey;
                    sortOrder = true;
                }

                this.model.rows = $filter('orderBy')((model || this.fullmodel).rows, (function (row) {
                    return row[this.sort];
                }).bind(this), !sortOrder);
            };

            this.applyFilters = function (config) {
                var search = $rootScope.search,
                    selections = $rootScope.selections,
                    cc = {window: {}},
                    filterGroup,
                    filterElement,
                    key;

                config = config || {};

                angular.copy(this.fullmodel.window, cc.window);
                ["defn", "header"].forEach((function (prop) {
                    cc[prop] = this.fullmodel[prop];
                }).bind(this));

                cc.partialUpdate = config.partialUpdate || false;

                if (search !== undefined && search.length) {

                    var dataSource = this.fullmodel.rows;

                    if (config.previousSearch !== undefined &&
                        search.indexOf(config.previousSearch) >= 0) {

                        dataSource = this.model.rows;
                    }
                    var re = new RegExp("^" + search, "i");

                    cc.rows = $filter('filter')(dataSource, function (value, index) {

                        for (var j = 0; j < value.length; j++) {

                            if (re.test(value[j])) {
                                return true;
                            }
                        }
                        return false;
                    }, false);

                    cc.window.trc = cc.rows.length;

                } else {

                    cc.rows = this.fullmodel.rows;
                    cc.window.trc = this.fullmodel.window.trc;
                }

                if (selections) {
                    cc.rows = $filter('filter')(cc.rows, function (row) {
                        for (key in selections) {
                            filterGroup = selections[key];

                            for (filterElement in filterGroup) {
                                if (filterGroup[filterElement]) {
                                    if (row[key] == filterElement) {
                                        return true;
                                    }
                                }
                            }
                        }
                        return false;
                    }, false);
                    cc.window.trc = cc.rows.length;
                }

                if (this.sort >= 0) {
                    this.applySort(-1, cc);
                } else {
                    this.model = cc;
                    try {
                        $scope.$digest();
                    } catch(e) {}
                }
            };

            this.getChunkRows = function (chunkIndex) {

                return this.model.rows.slice(chunkIndex * PAGE_SIZE, chunkIndex * PAGE_SIZE + PAGE_SIZE);
            };

            watchers.push($rootScope.$watch('search', (function (search, previousSearch) {

                if (timeout) {
                    window.clearTimeout(timeout);
                }

                if (search !== undefined) {
                    timeout = window.setTimeout((function () {

                        this.applyFilters({previousSearch: previousSearch});
                    }).bind(this), Math.max(0, (4 - search.length) * 100));

                }
            }).bind(this)));

            watchers.push($rootScope.$watch('selections', (function (selections) {
                if (selections !== undefined) {
                    this.applyFilters();
                }
            }).bind(this)));

            watchers.push($rootScope.$watch('model.selectedIndex', (function (selectedIndex) {
                if (selectedIndex !== undefined) {
                    $http.get($rootScope.model.pages[selectedIndex].data).success((function (data) {

                        var cc = {};

                        this.fullmodel = data;
                        $rootScope.visModel = data;
                        this.applyFilters();

                        if (data.window.tpc - 1 > data.window.cp) {

                            $chunkLoader.fetch({
                                dataURL: $rootScope.model.pages[selectedIndex].data,
                                startPage: 1
                            }).then(function (data) {

                                if (data && data.rows) {

                                    this.fullmodel.rows = this.fullmodel.rows.concat(data.rows);

                                    this.applyFilters({partialUpdate: true});
                                }
                            }.bind(this));
                        }

                    }).bind(this)).error((function (data) {
                        this.fullmodel = this.model = {};
                    }).bind(this));
                }
            }).bind(this)));

            $scope.$on('$destroy', function () {
                angular.forEach(watchers, function (watcher) {
                    watcher();
                });

            });

        }])

        .directive('dynamicCrossTab', ["$filter", "$window", "$mstrFormat", function ($filter, $window, $mstrFormat) {

            function format($filter, value, index, definition, header) {
                if (definition[header[index]] === 1) {
                    return $filter('date')(value, 'shortDate');
                }
                return value;
            }

            function buildHeaderHTMLArray(scope, headers) {

                var headerArray = [],
                    i,
                    sort = scope.xTabCtrl.sort,
                    style = $mstrFormat.getStyle("columnheader"),
                    prop,
                    resolvedStyle = "";

                headerArray.push("<colgroup>");
                for (i = 0; i < headers.length; i++) {
                    headerArray.push("<col>");
                }
                headerArray.push("</colgroup>");

                headerArray.push("<thead style=\"");

                for (prop in style) {
                    resolvedStyle += prop + ":" + style[prop] + ";"
                }

                headerArray.push(resolvedStyle);

                headerArray.push("\"><tr>");

                angular.forEach(headers, function (header, i) {
                    headerArray.push("<th");
                    if (sort === i) {
                        headerArray.push(" class=\"sorted\"");
                    }
                    headerArray.push(">");
                    headerArray.push(header);
                    headerArray.push("</th>");
                });

                headerArray.push("</tr></thead>");

                return headerArray;
            }

            function buildRowsHTMLArray($filter, rows, defn, header) {
                var rowsArray = [];

                rowsArray.push("<tbody>");

                angular.forEach(rows, function (row) {
                    rowsArray.push("<tr>");

                    angular.forEach(row, function (cell, index) {
                        rowsArray.push("<td>");
                        rowsArray.push(format($filter, cell, index, defn, header));
                        rowsArray.push("</td>");
                    });
                    rowsArray.push("</tr>");
                });

                rowsArray.push("</tbody>");

                return rowsArray;
            }

            function alignHeaders(xTabContainer, setAsFixed) {

                var displayTable = xTabContainer.firstChild,
                    lockedHeadersTable = xTabContainer.lastChild,
                    tableHeaders = displayTable.tHead.firstChild.childNodes,
                    tableColgroup = displayTable.firstChild,
                    lockedColGroup = lockedHeadersTable.firstChild,
                    width;

                angular.forEach(tableHeaders, function (header, i) {
                    width = header.clientWidth + "px";

                    tableColgroup.childNodes[i].style.width = lockedColGroup.childNodes[i].style.width = width;
                });

                if (setAsFixed) {

                    displayTable.style.tableLayout = setAsFixed ? "fixed" : "auto";
                }
            }

            return {
                restrict: 'A',
                link: function (scope, element, attributes) {

                    var loadedChunks = [0, 1],
                        $body = $(document.body),
                        $element = $(element),
                        newPages = false;

                    var onScroll = function() {

                        var model = scope.xTabCtrl.model,
                            position = ($body.scrollTop() * model.window.trc ) / (($element.height()) * PAGE_SIZE),
                            currentChunk = parseInt(position, 10),
                            units = model.header.length,
                            $table = $(element[0].firstChild),
                            tBodiesCollection = element[0].firstChild.tBodies,
                            pages = Math.ceil(model.window.trc / PAGE_SIZE),
                            tBodiesLength = 0,
                            i;

                        //no more chunks to render
                        if (currentChunk > Math.ceil(model.window.trc / PAGE_SIZE) - 1) {
                            return;
                        }

                        //check whether the need append new chunks bellow, assume this is the next one is missing.
                        if (loadedChunks.indexOf(currentChunk - 1) < 0 || loadedChunks.indexOf(currentChunk + 1) < 0) {

                            tBodiesLength = tBodiesCollection.length;

                            //are we jump scrolling?
                            if (tBodiesLength < currentChunk + 1) {

                                var gapSize = currentChunk - tBodiesLength - 1,
                                    gapHTMLArray = [];

                                //insert dummy tbodys, each with the height height of the average chunk height.
                                if (gapSize > 0) {

                                    var averagePageHeight = $table.height() / tBodiesLength;

                                    for (i = 0; i < gapSize; i++) {
                                        gapHTMLArray.push("<tbody><tr style=\"height:" + averagePageHeight + "px\"><td></td></tr></tbody>");

                                    }

                                    $table.append(gapHTMLArray.join(""));

                                    newPages = true;
                                }
                            } else {

                                //loop through all extra chunks and clear the ones we no longer need
                                while(tBodiesCollection.length > currentChunk + 2) {

                                    //remove it from DOM
                                    $(tBodiesCollection[tBodiesCollection.length - 1]).remove();
                                    //remove from the chunk index array
                                    loadedChunks = loadedChunks.slice(0, -1);
                                }
                            }

                            //loop through al loaded chunks and clear the ones we no longer need
                            loadedChunks.forEach(function (chunkId) {

                                if (chunkId < currentChunk - 1) {

                                    //clear the chunk by emptying but keep it's height
                                    tBodiesCollection[chunkId].innerHTML = "<tr style=\"height:" + $(tBodiesCollection[chunkId]).height() + "px\"><td colspan=\"" + units + "\"></td></tr>";
                                    //remove from the chunk index array
                                    loadedChunks = loadedChunks.slice(1);
                                }
                            });

                            //append new chunks
                            for (i = currentChunk - 1; i <= Math.min(currentChunk + 1, pages - 1); i++) {

                                //if chunk is missing
                                if (loadedChunks.indexOf(i) < 0) {

                                    if (tBodiesCollection.length <= i) {

                                        //append html
                                        $table.append(buildRowsHTMLArray($filter, scope.xTabCtrl.getChunkRows(i), model.defn, model.header).join(""));

                                        newPages = true;

                                        //add to index array
                                        loadedChunks.push(i);

                                    } else {

                                        if (i >= 0) {
                                            //re-render html
                                            tBodiesCollection[i].innerHTML = buildRowsHTMLArray($filter, scope.xTabCtrl.getChunkRows(i), model.defn, model.header).join("");

                                            //add to index array
                                            loadedChunks.splice(i - currentChunk + 1 , 0, i);
                                        }
                                    }

                                }
                            }

                            if (newPages = true) {
                                //recalculate container height, for better scroll position accuracy
                                element[0].style.height = ($table.height() / tBodiesCollection.length) * (model.window.trc / PAGE_SIZE) + "px";
                            }
                        }

                        element[0].lastChild.style.left = Math.min(Math.max(- $body.scrollLeft(), -($table.width() - $body.width())), 0) + "px";

                    };

                    angular.element($window).bind("scroll", onScroll);

                    scope.$on("$destroy", function () {
                        angular.element($window).unbind("scroll", onScroll);
                    });

                    scope.$watchCollection('xTabCtrl.model', function (model) {

                        var container = element[0];

                        if (model && model.header) {

                            if (model.partialUpdate) {

                                return;
                            }

                            var table = [],
                                headerArray = buildHeaderHTMLArray(scope, model.header);

                            //build the main table with the first set of rows and the locked headers table
                            table.push("<table class=\"table mstr-xtab locked\">");
                            table = table.concat(headerArray, buildRowsHTMLArray($filter, scope.xTabCtrl.getChunkRows(0), model.defn, model.header));

                            //add an additional chunk
                            if (model.rows.length > PAGE_SIZE) {
                                table = table.concat(buildRowsHTMLArray($filter, scope.xTabCtrl.getChunkRows(1), model.defn, model.header));
                            }

                            table.push("</table><table class=\"table mstr-xtab locked header\">");
                            table = table.concat(headerArray);
                            table.push("</table>");

                            //more that 50 letters, use small font size
                            //if ((model.header.join("").length > 50)) {
                                element.addClass("small");
                            //}

                            //clear any previous content
                            element.empty();

                            //push the tables to the DOM
                            element.prepend(table.join(""));

                            if (model.window.trc > PAGE_SIZE * 2) {

                                //resize the container to the possible max height based on the total pages x the initial height
                                container.style.height = container.firstChild.tBodies[0].clientHeight * model.window.trc / PAGE_SIZE + "px";

                                //get rendered headers and synch the locked headers width
                                alignHeaders(container, true);

                            } else {

                                container.style.height = "auto";                                //get rendered headers and synch the locked headers width
                                alignHeaders(container, false);
                            }
                        }
                    });

                }
            }

        }]);
})();