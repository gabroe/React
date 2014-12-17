'use strict';

(function () {

     function getActiveMonth(baseDate) {
        var date = new Date(baseDate);
        date.setDate(1);

        return date;
    }

    function getFirstDateInCalendar(baseDate) {
        var date = new Date(baseDate);
        date.setHours(0,0,0,0);
        date.setDate(1);
        date.setDate(1 - date.getDay());

        return date;
    }

     function buildCalendar(baseDate, today, selections) {
        var i, j,
            calendar = [],
            date = getFirstDateInCalendar(baseDate);

        for (i = 0; i < 6; i++) {
            var days = [];
            for (j = 0; j < 7; j++) {
                days.push({
                    date: new Date(date),
                    day: date.getDate(),
                    active: date.getMonth() === baseDate.getMonth(),
                    today: date.toLocaleDateString() === today.toLocaleDateString(),
                    selected: selections[date.toISOString()]
                });
                date.setDate(date.getDate() + 1);
            }
            calendar.push(days);
        }
        return calendar;
    }

    angular.module('mstr.calendar', [])

        .controller('CalendarCtrl', ['$scope', function ($scope) {

            var CALENDAR_MODE_DAY = 0,
                CALENDAR_MODE_MONTH = 1,
                CALENDAR_MODE_YEAR = 2;

            var today = new Date(),
                namedMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            $scope.currentMode = CALENDAR_MODE_DAY;
            $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            $scope.namedDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
            $scope.activeYear =
                $scope.activeMonth = getActiveMonth(today);

            this.navigate = function (delta) {
                var newDate;

                switch ($scope.currentMode) {
                    case CALENDAR_MODE_DAY:

                        newDate = new Date($scope.activeMonth);
                        newDate.setMonth(newDate.getMonth() + delta);
                        $scope.activeYear = $scope.activeMonth = newDate;

                        break;

                    case CALENDAR_MODE_MONTH:

                        newDate = new Date($scope.activeYear);
                        newDate.setFullYear(newDate.getFullYear() + delta);
                        $scope.activeYear = newDate;

                        break;
                    case CALENDAR_MODE_YEAR:

                        newDate = new Date($scope.activeYear);
                        newDate.setFullYear(newDate.getFullYear() + delta * 10);
                        $scope.activeYear = newDate;

                        break;
                }
            };

            this.toggle = function (day) {

                var ctrl = $scope.filterCtrl,
                    selectedIndex = ctrl.selectedIndex,
                    selections = ctrl.selections = ctrl.selections || {},
                    unitSelections = selections[selectedIndex] = selections[selectedIndex] || {},
                    date = day.date.toISOString();

                unitSelections[date] = !unitSelections[date];

            };

            this.switchMode = function () {
                $scope.currentMode = ($scope.currentMode + 1) % 3;
            }

            this.select = function (index) {

                switch ($scope.currentMode) {
                    case CALENDAR_MODE_MONTH:

                        $scope.activeYear.setMonth(index);
                        $scope.activeMonth = new Date($scope.activeYear);

                        $scope.currentMode = CALENDAR_MODE_DAY;

                        break;

                    case CALENDAR_MODE_YEAR:

                        var newDate = new Date($scope.activeYear);
                        newDate.setFullYear(this.getYearList()[index]);
                        $scope.activeYear = newDate;

                        $scope.currentMode = CALENDAR_MODE_MONTH;

                        break;
                }

            }

            this.getYearList = function () {
                var years = [],
                    startingYear = $scope.activeYear.getFullYear(),
                    i;

                startingYear -= startingYear % 10 + 1;

                for (i = 0; i < 12; i++) {
                    years.push(startingYear++);
                }

                return years;
            }

            this.isActive = function (index) {
                if ($scope.currentMode === CALENDAR_MODE_YEAR) {
                    return index > 0 && index < 11;
                }
                return false;
            }

            this.isSelected = function (index) {
                switch ($scope.currentMode) {
                    case CALENDAR_MODE_MONTH:

                        return $scope.activeMonth.getMonth() === index && $scope.activeMonth.getFullYear() === $scope.activeYear.getFullYear();

                    case CALENDAR_MODE_YEAR:

                        return $scope.activeMonth.getFullYear() === this.getYearList()[index];
                }
                return false;
            }

            this.getTitle = function () {
                switch ($scope.currentMode) {
                    case CALENDAR_MODE_MONTH:

                        return $scope.year;

                    case CALENDAR_MODE_YEAR:

                        var yearList = this.getYearList();

                        return yearList[1] + "-" + yearList[10];
                }
                return $scope.month + " " + $scope.year;
            }

            /*
             WATCHES
             */

            $scope.$watchCollection(function () {
                var filterCtrl = $scope.filterCtrl;
                return filterCtrl.selections[filterCtrl.selectedIndex];
            }, function (selections) {

                $scope.calendar = buildCalendar($scope.activeMonth, today, selections || {});
            });

            $scope.$watch(function () {return $scope.activeYear;}, function (activeYear) {
                $scope.year = activeYear.getFullYear();
            });

            $scope.$watch(function () {return $scope.activeMonth;}, function (activeMonth) {

                var filterCtrl = $scope.filterCtrl,
                    selections = filterCtrl.selections[filterCtrl.selectedIndex];

                $scope.month = namedMonths[activeMonth.getMonth()];
                $scope.year = activeMonth.getFullYear();
                $scope.calendar = buildCalendar(activeMonth, today, selections || {});
            });

        }]);

})();

