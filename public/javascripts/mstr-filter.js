'use strict';

(function () {

    angular.module('mstr.filter', [])

        .controller('FilterCtrl', function ($scope, $modalInstance, $filter, $mstrDataTypes) {

            this.editorOpen = false;
            this.fullmodel = this.model = {};
            $scope.maxHeight = window.innerHeight;
            this.selectedIndex = -1;
            this.search = {};
            this.selections = {};
            var $rootScope = $scope.$root;

            //create a temporary copy of the root selections, this is what the filter panel will manipulate until apply or close
            angular.copy($rootScope.selections, this.selections);

            $rootScope.$watch('visModel', (function (model) {
                if (model !== undefined) {
                    this.model = model;
                }
            }).bind(this));

            $scope.$watch('filter', function (filter) {

                //when the editor filter changes, set the predicate to filter those elements that match the "search" box input
                if (filter !== undefined) {
                    this.search = JSON.parse("{\"" + this.selectedIndex + "\":\"" + filter + "\"}");
                }
            });

            this.close = function () {

                //call the close() method on the $modalInstace object, this will dismiss the popup
                $modalInstance.close();
            };

            this.getOrderBy = function () {
                var column = this.selectedIndex;

                //pass back the function that returns wich column are we sorting on, in this case the column matched the filter panel selected index
                return function (row) {return row[column];};
            };

            this.getFilterPredicate = function () {
                var column = this.selectedIndex;

                return function (value) {
                    if ($scope.filter !== undefined) {
                        return value[column].toLowerCase().indexOf($scope.filter.toLowerCase()) > -1;
                    }
                    return true;
                };
            };

            this.clearFilter = function () {

                //set root selections collection to null to clear everything
                $rootScope.selections = null;

                //then close the dialog
                this.close();
            };

            this.clearUnitSelections = function () {

                //for clear all (for the current unit in the editor, just delete its selections collection
                if (this.selections && this.selections[this.selectedIndex]) {
                    delete this.selections[this.selectedIndex];
                }
            };

            this.selectAll = function () {
                var selectedIndex = this.selectedIndex,
                    selections = this.selections[selectedIndex] = {};

                //loop through all unique elements and set their value to true
                angular.forEach($filter('unique')(this.model.rows, selectedIndex), function (row) {
                    selections[row[selectedIndex]] = true;
                });
            };

            this.selectOnly = function (index) {
                var selectedIndex = this.selectedIndex,

                //reset to a new object since we are clearing all selections for the unit
                    selections = this.selections[selectedIndex] = {};

                //find the element row from all data by filtering unique items & set its value to true
                selections[$filter('orderBy')(($filter('unique')(this.model.rows, selectedIndex)), function (row) {
                    return row[selectedIndex];
                })[index][selectedIndex]] = true;
            };

            this.applyFilter = function () {
                var unitIndex,
                    elementKey,
                    clear = true;

                if (this.selections) {

                    //clear selections if user has deselected all checkboxes
                    for (unitIndex in this.selections) {
                        for (elementKey in this.selections[unitIndex]) {
                            if (this.selections[unitIndex][elementKey]) {
                                clear = false;
                                continue;
                            }
                        }
                        if (clear) {
                            delete this.selections[unitIndex];
                        }
                        clear = true;
                    }

                    if (!Object.keys(this.selections).length) {
                        this.selections = null;
                    }

                    //pass current selections to root scope so the current visualization can filter the data
                    $rootScope.selections = this.selections;
                }
                this.close();
            };

            this.toggleEditor = function (index) {

                //determine whether the editor is open already for the requested unit index.
                this.editorOpen = this.selectedIndex !== index;

                //set the new unit index or close it by resetting it to -1
                this.selectedIndex = this.editorOpen ? index : -1;
            };

            this.format = function (value) {
                return $filter('date')(value, 'shortDate');
            };

            this.isSelectorAvailable = function (type) {
                var model = this.model,
                    selectedIndex = this.selectedIndex,
                    selectorTypes = [$mstrDataTypes.geo.state, $mstrDataTypes.date],
                    selectedUnitType;

                if (selectedIndex < 0) {
                    return false;
                }

                selectedUnitType = model.defn[model.header[this.selectedIndex]];

                if (selectorTypes.indexOf(type) >= 0) {
                    return type === selectedUnitType;
                }

                if (selectorTypes.indexOf(selectedUnitType) < 0) {
                    return ($filter('unique')(this.model.rows, selectedIndex)).length < 10;
                }

                return false;
            };
        })

        .directive('mstrFilter', function () {
            return {
                restrict: 'A',
                templateUrl: function (scope, element, attributes) {
                    debugger;
                    return '/templates/filters/calendar.html';
                },
                controller: function ($scope) {
                    debugger;
                }
            }

        });

})();

