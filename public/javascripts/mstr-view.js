'use strict';

angular.module('mstr.view', ['ngRoute'])

    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

        $routeProvider.when('/:index', {
            templateUrl: '/templates/dossier-page.html',
            controller: 'DossierCtrl'
        });
    }])

    .controller('DossierCtrl', ['$rootScope', '$routeParams', function($rootScope, $routeParams) {
        $rootScope.$watch('model', function (model) {
            if (model) {
                model.selectedIndex = parseInt($routeParams.index, 10);
            }
        });
    }]);
