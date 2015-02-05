(function () {

    var app = angular.module('mstr.api', ['ui.bootstrap', 'ngSanitize']);

    app.controller('APIRefCtrl', ['$sce', '$scope', '$http', function ($sce, $scope, $http) {

        $http.get("/javascripts/api/api-reference.json").success(function (data) {

            this.apis = data.api;
            $scope.api = this.apis[0];

        });

        this.parameters = {};

        $scope.result = {};

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
                requiredParams = {
                    "PUT": ["node", "body"],
                    "DELETE": ["node"],
                    "POST" : ["body"]
                },
                parameters = [];

            try {
                if (requiredParams[method]) {
                    requiredParams[method].forEach(function (parameter) {
                        if ((params && params[parameter]) === undefined) {
                            throw 1;
                        }
                    });
                }
            }
            catch (e) {
                processResult("Missing required field.", "Error");
                return;
            }

            if (node !== undefined) {
                url += ("/" + node);
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