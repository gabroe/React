(function () {
    var $ = require('jquery'),
        Backbone = require('backbone'),
        mstrX = require('../../mstrX'),
        $XHR = require('../../util/xhr'),
        DossierModel = require('./DossierModel'),
        DossierViewer = require('./DossierViewer');


    Backbone.$ = $;

    function getDossierDataAPIFromURL(absUrl) {

        var url = /\/[^\/]*\#/.exec(absUrl),
            result = "/api/dossiers/";

        if (url.length) {

            return result + url[0].replace(/[\/\#]/g, "");
        }
        return result;
    }

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

    function getFetchPageURL(connection, table) {

        var url = [];

        url.push("/data/");
        url.push(connection.dbtype);
        url.push("/tables/");
        url.push(table.replace("/redshift/", ""));
        url.push("?token=");
        url.push(connection.token);

        return url.join("");
    }

    function fetchPageData(connection, table) {
        return $XHR.request(getFetchPageURL(connection, table)).success(function (data) {
            dossierApp.model.set({
                pageData: data
            });
        });
    }

    function getTokenURLAndFetchPage(page) {
        var connection = page.connection,
            token = connection.token;

        if (!token) {
            return $XHR.request(getCreateTokenURL(connection)).success(function success(data) {
                connection.token = data.data["connection-token"];
                fetchPageData(connection, page.data);
            });
        } else {
            return fetchPageData(connection, page.data);
        }
    }

    // Chunk loader code.
    (function () {
        var chunkLoaderWorker = new Worker("/javascripts/mstr-data-chunk-loader.js"),
            defer = $.Deferred();

        chunkLoaderWorker.addEventListener('message', function (e) {

            defer.resolve(e.data);
        });

        mstrX.chunkLoader = {
            worker: chunkLoaderWorker,

            fetch: function (request) {
                defer = $.Deferred();

                chunkLoaderWorker.postMessage(request);
                return defer;
            }
        }
    })();

    /**
     * The root class associated with the dossier viewer app.
     *
     * @class
     */
    var dossierApp = {
        start: function start(props) {
            var AppRouter = Backbone.Router.extend({
                    routes: {
                        "*actions": "defaultRoute" // matches http://example.com/#anything-here
                    }
                }),
                model = this.model = props.model;

            // Initiate the router
            var app_router = new AppRouter;

            // Event listener on the model.
            model.on('change:pageData', function (model) {
                // Start rendering the view.
                DossierViewer.start(model);
            }.bind(this));

            app_router.on('route:defaultRoute', function (pageNumber) {
                // Get the URL Location
                var location = Backbone.history.location;

                // Set the page number on the model.
                model.set({
                    page: pageNumber
                });

                // Do we not already have the dossier data ?
                if (model.get('data') === undefined) {
                    $XHR.request(getDossierDataAPIFromURL(location.href)).success(function (data) {
                        // Set the dossier data on the model.
                        model.set({
                            data: data
                        });

                        // Finally - now that we have the data - fetch the page data.
                        this.fetchPage();

                    }.bind(this));
                } else {
                    // If we already have the dossier data - fetch the new page data.
                    this.fetchPage();
                }
            }.bind(this));

            // Start Backbone history a necessary step for bookmarkable URL's
            Backbone.history.start();

            // TODO - NS: Debug Code to change the page size while performance testing.
            model.on('change:pageSize', function (model, pageSize) {
                model.PAGE_SIZE = pageSize;

                // Update the view with the new data.
                model.triggerUpdateView();
            });
        },

        fetchPage: function fetchPage() {
            return getTokenURLAndFetchPage(this.model.get('data').pages[this.model.get('page')] );
        },

        getDataURL: function getDataURL(page) {
            var url = [];

            url.push("/data/");
            url.push(page.connection.dbtype);
            url.push("/tables/");
            url.push(page.data.replace("/redshift/", ""));

            return url.join("");
        }
    };

    // Cache the app on the global context
    window.mstrApp = dossierApp;

    module.exports = dossierApp;

    // Finally start the Dossier App and provide it an instance of the model.
    mstrApp.start({
        model: new DossierModel()
    });
})();