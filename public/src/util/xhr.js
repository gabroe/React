(function () {
    /**
     * The XHR utility object.
     *
     * @type {Object}
     * @namespace
     */
    mstrX.util.xhr = {
        /**
         * Piggy-backs on the JQuery's ajax call to make the request.
         *
         * @param {String} url The URL to make the ajax request on.
         *
         * @returns {*} The JQuery promise object.
         */
        request: function request(url) {
            return $.ajax({
                url: url,
                dataType: 'json'
            });
        }
    }
})();