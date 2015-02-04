(function () {

    /**
     * The model associated with the All Dossiers page.
     *
     * @class
     */
    mstrX.app.dossiers.AllDossierModel = Backbone.Model.extend({
        /**
         * Denotes the page being viewed in the DossierViewer.
         *
         * @default 0
         * @type {Number}
         */
        page: 0,

        /**
         *
         */
        pageData: undefined,

        /**
         * Overriding the constructor of the model to request the data for the all dossiers page.
         *
         */
        constructor: function constructor() {
            // Call super.
            Backbone.Model.apply(this, arguments);

            // Request all the dossier data.
            mstrX.util.xhr.request('/api/dossiers').success(function (data) {
                // Trigger the update view event and pass the data.
                this.trigger('updateView', data.concat());
            }.bind(this));
        },

        /**
         * Sorts the dossiers in the app by the name of the dossier.
         *
         * @param {Object} data The all dossier data.
         */
        sort: function triggerSort(data) {
            var sortValue = this.sortValue,
                newSortValue = sortValue !== true;

            // Sort the array by name.
            data.sort(function (a, b) {
                return (a.name || '').localeCompare(b.name || '');
            }, this);

            // Reverse the array if we're sorting ascending.
            if (newSortValue === false) {
                data.reverse();
            }

            // Remeber the previous sorted value.
            this.sortValue = newSortValue;

            // Trigger the update view event and pass a copy of the data.
            this.trigger('updateView', data.concat());
        }
    });
})();