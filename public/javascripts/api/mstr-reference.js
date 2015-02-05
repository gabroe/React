(function () {

    function findApiIndex(apis, apiName) {
        try {
            apis.forEach(function (api, index) {
                if (api.key.toLowerCase() === apiName.toLowerCase()) {
                    throw index;
                }
            });
        } catch (index) {
            return index;
        }
        return 0;
    }

    var app = angular.module('mstr.api', ['ui.bootstrap', 'ngSanitize']);

    app.controller('APIRefCtrl', ['$sce', '$scope', '$http', '$location', function ($sce, $scope, $http, $location) {

        $http.get("/javascripts/api/api-reference.json").success(function (data) {

            $scope.apis = data.api;
            $scope.selected = findApiIndex(data.api, $location.path().substring(1));
            $scope.api = $scope.apis[$scope.selected];

        });

        this.parameters = {};

        $scope.result = {};

        this.selectApi = function (index) {
            $scope.selected = index;
            $scope.api = $scope.apis[index];
        }

        this.isActive = function (index) {
            return $scope.selected === index;
        }

        this.isSubmitDisabled = function (method, nodeRequired, bodyRequired) {
            var params = this.parameters[method],
                nodeValue = params && params.node,
                bodyValue = params && params.body;

            if (nodeRequired && (nodeValue === undefined || nodeValue.length === 0)) {
                return true;
            }

            if (bodyRequired && (bodyValue === undefined || bodyValue.length === 0)) {
                return true;
            }

            return false;
        }

        this.format = function (label) {
            if (label) {
                return $sce.trustAsHtml(label.replace(/<_/g, "<span class=\"field\">").replace(/\_>/g, "</span>").replace(/<</g, "<code>").replace(/>>/g, "</code>"));
            }
            return "";
        };

        var processResult = function (data, status) {
            $scope.result.status = status;
            $scope.result.data = data;
            $('.modal').modal('show');
        };

        this.callAPI = function (method) {
            var url = $scope.api.url,
                params = this.parameters[method],
                node = params && params.node,
                body = params && params.body,
                parameters = [];

            if (node !== undefined) {
                url += ("/" + node);
            }

            if ($scope.api.edge !== undefined) {
                url += ($scope.api.edge);
            }

            parameters.push(url);

            if (body) {
                parameters.push(body);
            }

            $http[method.toLowerCase()].apply(this, parameters)
                .success(processResult)
                .error(processResult);
        }


    }]);
})();