(function () {

    /**
     * The global mstrX namespace.
     *
     * @namespace
     */
    window.mstrX = {
        /**
         * The root namespace for the different apps that are supported in Sirius Web.
         *
         * @namespace
         */
        app: {
            /**
             * The namespace for the all dossiers app page.
             *
             * @namespace
             */
            dossiers: {},

            /**
             * The namespace for the dossier viewer app page.
             *
             * @namespace
             */
            viewer: {
                viz: {
                    xtab: {}
                }
            }
        },

        /**
         * The utilities namespace.
         *
         * @namespace
         */
        util: {},

        /**
         * The namespace for generic UI components.
         *
         * @namespace
         */
        ui: {}
    };

    module.exports = window.mstrX;

})();