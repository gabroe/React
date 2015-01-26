'use strict';

(function () {

    var PAGE_SIZE = 100,
        timeout;

    function trackEvent($http, msg) {

        $http.get('/api/logEvent', {params: {msg: msg}}).success(function (data) {
            console.log(JSON.stringify(data));
        });
    }

    function currentPage(root) {
        var m = root.model,
            pgs = m.pages,
            idx = m.selectedIndex;
        return pgs[idx].name || '';
    }

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
        }
        ])

        .controller('xTabController', ['$scope', '$rootScope', '$http', '$filter', '$chunkLoader', '$mstrdata', function ($scope, $rootScope, $http, $filter, $chunkLoader, $mstrdata) {
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
                    var re = new RegExp("^" + search + "|[ ]+" + search, "i");

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
                    } catch (e) {
                    }
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
                        // event tracking
                        trackEvent($http, {action: 'search', page: currentPage($rootScope), pattern: search});

                        this.applyFilters({previousSearch: $scope.previousSearch});

                        if (search.length) {

                            var re = new RegExp("^" + search + "|[ ]+" + search, "i");

                            $scope.previousSearch = search;
                            $rootScope.suggestions = [];

                            try {
                                var breakException = {},
                                    match;

                                this.model.rows.forEach(function (row) {
                                    row.some(function (element) {
                                        if (re.test(element)) {
                                            match = (element + "").replace(re, function (match) {
                                                return "<strong>" + match + "</strong>";
                                            });

                                            if (!$rootScope.suggestions.some(function (el) {
                                                    return el.value === element;
                                                })) {
                                                $rootScope.suggestions.push({value: element, match: match});
                                            }

                                            return true;
                                        }
                                        return false;
                                    });

                                    if (Object.keys($rootScope.suggestions).length > 5) {
                                        throw breakException
                                    }
                                });
                            } catch (e) {
                                if (e !== breakException) {
                                    throw e;
                                }
                            }
                            $rootScope.$digest();
                        }

                    }).bind(this), Math.max(0, (4 - search.length) * 100));

                } else {
                    $rootScope.suggestions = null;
                }
            }).bind(this)));

            watchers.push($rootScope.$watch('selections', (function (selections) {
                if (selections !== undefined) {
                    this.applyFilters();
                }
            }).bind(this)));

            watchers.push($rootScope.$watch('model.selectedIndex', (function (selectedIndex) {
                if (selectedIndex !== undefined) {

                    var page = $rootScope.model.pages[selectedIndex];

                    $mstrdata.fetch(page).then((function (data) {
                        var cc = {};

                        this.fullmodel = data;
                        $rootScope.visModel = data;
                        this.applyFilters();

                        if (data.window.tpc - 1 > data.window.cp) {

                            $chunkLoader.fetch({
                                dataURL: $mstrdata.getDataURL(page),
                                startPage: 1,
                                token: page.connection.token
                            }).then(function (data) {

                                if (data && data.rows) {

                                    this.fullmodel.rows = this.fullmodel.rows.concat(data.rows);

                                    this.applyFilters({partialUpdate: true});
                                }
                            }.bind(this));
                        }
                    }).bind(this), (function () {//error case

                        this.fullmodel = this.model = {};

                    }).bind(this));
                }
            }).bind(this)));

            $scope.$on('$destroy', function () {
                angular.forEach(watchers, function (watcher) {
                    watcher();
                });

            });

        }
        ])

        .directive('dynamicCrossTab', ["$filter", "$window", "$mstrFormat", "$mstrDataTypes", function ($filter, $window, $mstrFormat, $mstrDataTypes) {

            return {
                restrict: 'A',
                link: function (scope, element, attributes) {

                    var formatManager = $mstrFormat.getNewFormatManager();

                    var loadedChunks = [0, 1],
                        $element = $(element);

                    var hasResizableUnits = function (definition) {
                        var unit;

                        if (scope.hasResizableElements === undefined) {

                            for (unit in definition) {

                                if ([$mstrDataTypes.date, $mstrDataTypes.name].indexOf(definition[unit]) >= 0) {
                                    return scope.hasResizableElements = true;
                                }
                            }
                            scope.hasResizableElements = false;
                        }
                        return scope.hasResizableElements;
                    };

                    var format = function ($filter, value, index, definition, header) {
                        var dataType = definition[header[index]],
                            formatMask;

                        switch (dataType) {

                        case $mstrDataTypes.date:

                            formatMask = formatManager.getDisplayFormat(dataType);

                            return $filter('date')(value, formatMask);

                        case $mstrDataTypes.name:

                            formatMask = formatManager.getDisplayFormat(dataType);

                            if (formatMask) {
                                return $filter(formatMask)(value);
                            }
                            break;
                        }
                        return value;
                    }

                    var buildHeaderHTMLArray = function (headers, childType) {

                        var headerArray = [],
                            i,
                            sort = scope.xTabCtrl.sort;

                        if (childType & 1) {
                            headerArray.push("<colgroup>");
                            for (i = 0; i < headers.length; i++) {
                                headerArray.push("<col>");
                            }
                            headerArray.push("</colgroup>");

                        }

                        if (childType & 2) {
                            headerArray.push("<thead><tr>");

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
                        }

                        return headerArray;
                    }

                    var buildRowsHTMLArray = function ($filter, rows, defn, header) {
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

                    var alignHeaders = function (element, setAsFixed) {

                        var $displayTable = $("table.mstr-xtab.body", element),
                            $lockedHeadersTable = $("table.mstr-xtab.header", element),
                            $tableHeaders = $("tbody:first-of-type tr:first-child td", $displayTable),
                            $tableCols = $("col", $displayTable),
                            $lockedCols = $("col", $lockedHeadersTable),
                            width,
                            totalwidth = 0;

                        $tableHeaders.each(function (index, element) {
                            width = element.clientWidth;

                            $($tableCols.get(index)).width(width);
                            $($lockedCols.get(index)).width(width);

                            totalwidth += width;
                        });

                        $lockedHeadersTable.width(totalwidth);
                        $lockedHeadersTable.css("max-width", totalwidth);

                        if (setAsFixed) {

                            $displayTable.css("table-layout", setAsFixed ? "fixed" : "auto");
                        }
                    }

                    var onScroll = function () {

                        var model = scope.xTabCtrl.model,
                            position = ($(".mstr-xtab-scrollable", element).scrollTop() * model.window.trc ) / (($(".mstr-xtab-container", element).height()) * PAGE_SIZE),
                            currentChunk = parseInt(position, 10),
                            units = model.header.length,
                            $table = $("table.mstr-xtab.body", element),
                            tBodiesCollection = $table.get(0).tBodies,
                            pages = Math.ceil(model.window.trc / PAGE_SIZE),
                            tBodiesLength = 0,
                            newPages = false,
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
                                }
                            } else {

                                //loop through all extra chunks and clear the ones we no longer need
                                while (tBodiesCollection.length > currentChunk + 2) {

                                    //remove it from DOM
                                    $(tBodiesCollection[tBodiesCollection.length - 1]).remove();
                                    //remove from the chunk index array
                                    loadedChunks = loadedChunks.slice(0, -1);
                                }
                            }

                            //loop through all loaded chunks and clear the ones we no longer need
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
                                            loadedChunks.splice(i - currentChunk + 1, 0, i);
                                        }
                                    }

                                }
                            }

                            if (newPages) {
                                if (loadedChunks.indexOf(pages - 1) >= 0) {
                                    //    //recalculate container height, for better scroll position accuracy
                                    $(".mstr-xtab-container", element).height("auto");
                                    //    //element[0].style.height = ($table.height() / tBodiesCollection.length) * (model.window.trc / PAGE_SIZE) + "px";
                                } else {
                                    $(".mstr-xtab-container", element).height(($table.height() / tBodiesCollection.length) * (model.window.trc / PAGE_SIZE));
                                }
                            }
                        }

                        $("table.mstr-xtab.header", element).css("left", -$(".mstr-xtab-scrollable", element).scrollLeft());

                    };

                    var displayXTab = function (model, adjustColumn) {

                        var table = [],
                            style = $mstrFormat.getStyle("columnheader"),
                            resolvedStyle = "",
                            prop,
                            $table;

                        //build the main table with the first set of rows and the locked headers table
                        table.push("<div class=\"mstr-xtab-scrollable\"><div class=\"mstr-xtab-container\"><table class=\"table mstr-xtab body\">");
                        table = table.concat(buildHeaderHTMLArray(model.header, 1), buildRowsHTMLArray($filter, scope.xTabCtrl.getChunkRows(0), model.defn, model.header));

                        //add an additional chunk
                        if (model.rows.length > PAGE_SIZE) {
                            table = table.concat(buildRowsHTMLArray($filter, scope.xTabCtrl.getChunkRows(1), model.defn, model.header));
                        }

                        for (prop in style) {
                            resolvedStyle += prop + ":" + style[prop] + ";"
                        }

                        table.push("</table></div></div><div class=\"mstr-xtab-header-container\" style=\"");
                        table.push(resolvedStyle);
                        table.push("\"><table class=\"table mstr-xtab header\" style=\"");

                        table.push(resolvedStyle);

                        table.push("\">");
                        table = table.concat(buildHeaderHTMLArray(model.header, 3));
                        table.push("</table></div>");

                        //clear any previous content
                        element.empty();

                        //push the tables to the DOM
                        element.prepend(table.join(""));

                        $table = $("table.mstr-xtab.body", element);

                        var $scrollable = $(".mstr-xtab-scrollable", element);

                        $scrollable.off("scroll");

                        $scrollable.on("scroll", onScroll);

                        if (model.window.trc > PAGE_SIZE * 2) {

                            //resize the container to the possible max height based on the total pages x the initial height
                            $(".mstr-xtab-container", element).height($("tbody", $table).get(0).clientHeight * model.window.trc / PAGE_SIZE);

                            //get rendered headers and synch the locked headers width
                            alignHeaders(element, true);

                        } else {

                            $(".mstr-xtab-container", element).height("auto");
                            //get rendered headers and synch the locked headers width
                            alignHeaders(element, false);
                        }

                        adjustDisplayFormats(model, adjustColumn);
                    };

                    var adjustDisplayFormats = function (model, adjustColumn) {

                        if (hasResizableUnits(model.defn)) {

                            //adjust dynamic formatting (long date vs short date, etc)
                            if ($("table.mstr-xtab.header", element).width() > $element.width()) {

                                if (formatManager.isShorterFormatAvailable($mstrDataTypes.date) || formatManager.isShorterFormatAvailable($mstrDataTypes.name)) {
                                    formatManager.setShorterFormat($mstrDataTypes.date);
                                    formatManager.setShorterFormat($mstrDataTypes.name);

                                    displayXTab(model, -1);
                                }
                            }
                            else if (adjustColumn != -1) {

                                if (formatManager.isLongerFormatAvailable($mstrDataTypes.date) > 0 || formatManager.isLongerFormatAvailable($mstrDataTypes.name) > 0) {
                                    formatManager.setLongerFormat($mstrDataTypes.date);
                                    formatManager.setLongerFormat($mstrDataTypes.name);

                                    displayXTab(model, 1);
                                }
                            }
                        }
                    };

                    var onResize = function () {
                        displayXTab(scope.xTabCtrl.model);
                    };

                    angular.element($window).on("resize", onResize);

                    scope.$on("$destroy", function () {
                        $(".mstr-xtab-scrollable", element).off("scroll");
                        angular.element($window).off("resize", onResize);
                    });

                    scope.$watchCollection('xTabCtrl.model', function (model) {

                        if (model && model.header) {

                            if (model.partialUpdate) {

                                return;
                            }

                            displayXTab(model);

                        }
                    });

                }
            }

        }
        ]);
})();