'use strict';

angular.module('mstr.barSelector', [])

    .directive('barSelector', ['$filter', function ($filter) {
        return {
            restrict: 'A',
            link: function (scope, element, attributes) {
                scope.$watch('filterCtrl.selectedIndex', function (selectedIndex) {

                    if (selectedIndex == -1) {
                        return;
                    }

                    //only render the bar selector if the filter panel says it's ok (cardinality check)
                    //if (!scope.filterCtrl.isSelectorAvailable(0)) {
                    //    return;
                    //}

                    google.load("visualization", "1", {
                        packages: ["corechart"], callback: function () {
                            try {
                                var rows = scope.filterCtrl.model.rows,
                                    elements = {},
                                    dataValues = [],
                                    cardinality = $filter('unique')(rows, selectedIndex).length;

                                //count occurrences of each element and store it in the elements hash
                                angular.forEach(rows, function (row) {
                                    var value = row[selectedIndex];

                                    if (elements[value] === undefined) {
                                        elements[value] = 0;
                                    }

                                    elements[value] = elements[value] + 1;
                                });

                                //build the array[][] to be used by the chart
                                angular.forEach(elements, function (element, key) {
                                    dataValues.push([key, element, "#46ACE1"]);
                                });

                                //prepend the title row, but sort alphabetically first
                                dataValues = [["Value", "Count", {role: "style"}]].concat($filter('orderBy')(dataValues, function (row) {
                                    //use the first column for sorting
                                    return row[0];
                                }));

                                var data = google.visualization.arrayToDataTable(dataValues),
                                    options = {
                                        width: 398,
                                        height: cardinality * 50, //the height is dynamic to superimpose the checkboxes for filter selection
                                        legend: 'none',
                                        vAxis: {
                                            textPosition: 'none'
                                        },
                                        chartArea: {
                                            left: 61,
                                            top: 0,
                                            height: '89%'
                                        },
                                        animation:{
                                            duration: 700,
                                            easing: 'out'
                                        },
                                        hAxis: {
                                            textPosition: 'out'
                                        }
                                    };

                                //create a new google bar chart and cache it for later use (for animation)
                                scope.theChart = scope.theChart || new google.visualization.BarChart(element[0]);

                                //draw the google chart
                                scope.theChart.draw(data, options);

                            } catch (e) {
                            }
                        }
                    });
                });

            }

        }
    }]);