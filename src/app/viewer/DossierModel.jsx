(function () {

    var $ = require('jquery'),
        Backbone = require('backbone'),
        dossierApp = require('./DossierApp');

    Backbone.$ = $;

    /**
     * The model associated with the Dossier Viewer.
     *
     *
     * @class
     */
    var DossierModel = Backbone.Model.extend({
        /**
         * Constant specifying the number of rows per page.
         *
         * @constant
         * @default 100
         */
        PAGE_SIZE: 100,

        /**
         * Spins off a web worker and incrementally fetches all the data for the current page.
         *
         * TODO: NS - See how we can use fetch and save.
         */
        fetchPages: function fetchPages() {
            // Kick-off fetching the data.
            mstrApp.fetchPage().then((function (data) {
                // Cache the full data once all of the data has been fetched.
                this.fullData = data;

                if (data.window.tpc - 1 > data.window.cp) {
                    var pageNumber = this.get('page'),
                        page = this.get('data').pages[pageNumber];

                    // Fetch all the pages using the chunk loader.
                    mstrX.chunkLoader.fetch({
                        dataURL: mstrApp.getDataURL(page),
                        startPage: 1,
                        token: page.connection.token
                    }).then(function (data) {
                        // Does the data have more rows ?
                        if (data && data.rows) {
                            // Update the full data with the rows returns from the request.
                            this.fullData.rows = this.fullData.rows.concat(data.rows);

                            // Trigger the update view event and pass a copy of the data.
                            this.trigger('postFetchPages', this.fullData);
                        }
                    }.bind(this));
                }
            }.bind(this)));
        },

        /**
         * Returns the title of the page.
         *
         * @param {Number=} pageNumber Optional property returns the name of the page.
         * @returns {String} The title of the page.
         */
        getPageName: function getPageName(pageNumber) {
            return this.get("data").pages[pageNumber || parseInt(this.get("page"), 10)].name;
        },

        /**
         *
         *
         * @param {Number} columnIndex The index of the column that needs to be sorted.
         */
        sort: function sort(columnIndex) {
            var fullData = this.fullData,
                sorts = fullData.sorts = fullData.sorts || [],
                sortValue = sorts[columnIndex],
                newSortValue = sortValue !== true;

            // Sort the array by the column index.
            fullData.rows.sort(function (a, b) {
                return (a[columnIndex] || '').localeCompare(b[columnIndex]);
            }, this);

            // Reverse the array if we're sorting ascending.
            if (newSortValue === false) {
                fullData.rows.reverse();
            }

            // Remeber the previous sorted value.
            sorts[columnIndex] = newSortValue;

            // Trigger the update view event and pass a copy of the data.
            this.trigger('updateView', fullData);
        },

        triggerUpdateView: function triggerUpdateView(fullData) {
            // Trigger the update view event and pass a copy of the data.
            this.trigger('updateView', fullData || this.fullData);
        }
    });

    module.exports = DossierModel;
})();