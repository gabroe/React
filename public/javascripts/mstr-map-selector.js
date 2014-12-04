'use strict';

angular.module('mstr.mapSelector', [])

    .directive('mapSelector', function () {
        var statesMap = {1: "AL", 2: "AK", 4: "AZ", 5: "AR", 6: "CA", 8: "CO", 9: "CT", 10: "DE", 11: "DC", 12: "FL", 13: "GA", 15: "HI", 16: "ID", 17: "IL", 18: "IN", 19: "IA", 20: "KS", 21: "KY", 22: "LA", 23: "ME", 24: "MD", 25: "MA", 26: "MI", 27: "MN", 28: "MS", 29: "MO", 30: "MT", 31: "NE", 32: "NV", 33: "NH", 34: "NJ", 35: "NM", 36: "NY", 37: "NC", 38: "ND", 39: "OH", 40: "OK", 41: "OR", 42: "PA", 44: "RI", 45: "SC", 46: "SD", 47: "TN", 48: "TX", 49: "UT", 50: "VT", 51: "VA", 53: "WA", 54: "WV", 55: "WI", 56: "WY"};

        return {
            restrict: 'A',
            link: function (scope, element, attributes) {

                var path = d3.geo.path();

                var svg = d3.select(element[0]).append("svg")
                    .attr("width", 398)
                    .attr("height", 230)
                    .append("g").
                    attr("transform", "scale(0.43)");

                d3.json("/data/us.json", function(error, us) {
                    svg.append("path")
                        .datum(topojson.feature(us, us.objects.land))
                        .attr("class", "land")
                        .attr("d", path);

                    svg.selectAll(".state")
                        .data(topojson.feature(us, us.objects.states).features)
                        .enter().append("path")
                        .attr("class", "state")
                        .attr("id", function (d) {
                            return statesMap[d.id];
                        })
                        .attr("d", path)
                        .on("click", function (d) {

                            var ctrl = scope.filterCtrl,
                                selectedIndex = ctrl.selectedIndex,
                                selections = ctrl.selections = ctrl.selections || {},
                                unitSelections = selections[selectedIndex] = selections[selectedIndex] || {},
                                state = statesMap[d.id];

                            unitSelections[state] = !unitSelections[state];
                        })
                        .on("mouseover", function (d) {
                            d3.select(this).classed("active", true);
                        })
                        .on("mouseout", function (d) {
                            d3.select(this).classed("active", false);
                        });
                });

                scope.$watchCollection(function () {
                    return scope.filterCtrl.selections[scope.filterCtrl.selectedIndex];
                }, function (selections) {
                    var model = scope.filterCtrl.model,
                        state,
                        selectedIndex = scope.filterCtrl.selectedIndex;

                    if (selectedIndex < 0 || model.defn[model.header[selectedIndex]] != 2) {
                        return;
                    }

                    //clear all previous selections.
                    //otherwise missing states previously selected will remain selected
                    angular.forEach(statesMap, function (state) {
                        d3.select(element[0]).select("#" + state).classed("selected", false);
                    });

                    if (selections) {
                        for (state in selections) {
                            d3.select(element[0]).select("#" + state).classed("selected", selections[state]);
                        }
                    }
                });

            }
        }
    });