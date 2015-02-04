(function () {
    var MSTR_DATA_TYPES = {
        date: 1,
        geo: {
            state: 2
        },
        name: 3,
        text: 4
    };

    var FORMATS = {};

    FORMATS[MSTR_DATA_TYPES.date] = ["fullDate", "longDate", "mediumDate", "shortDate"];
    FORMATS[MSTR_DATA_TYPES.name] = [null, "shortName"];

    /**
     * The format manager for the dossier viewer.
     *
     * @namespace
     */
    mstrX.util.formatManager = {
        getStyle: function getStyle(data, path) {
            var styleDefinition = data && data.style,
                pathArray = path.split(".");

            if (styleDefinition) {
                pathArray.forEach(function (token) {
                    styleDefinition = styleDefinition[token];
                });

                return styleDefinition;
            }
            return {};
        },

        getNewFormatManager: function getNewFormatManager() {

            return (function () {
                var currentFormats = {};

                currentFormats[MSTR_DATA_TYPES.date] = 0;
                currentFormats[MSTR_DATA_TYPES.name] = 0;

                return {
                    isLongerFormatAvailable: function (dataType) {
                        var currentFormat = currentFormats[dataType];

                        return currentFormats[dataType] > 0;
                    },

                    isShorterFormatAvailable: function (dataType) {

                        return currentFormats[dataType] < FORMATS[dataType].length - 1;
                    },

                    getShorterFormat: function (dataType) {
                        var currentFormat = currentFormats[dataType] = Math.min(FORMATS[dataType].length - 1, currentFormats[dataType] + 1);

                        return FORMATS[currentFormat];
                    },

                    getLongerFormat: function (dataType) {
                        var currentFormat = currentFormats[dataType] = Math.max(0, currentFormats[dataType] - 1);

                        return FORMATS[dataType][currentFormat];
                    },

                    getDisplayFormat: function (dataType) {

                        return FORMATS[dataType][currentFormats[dataType]];
                    },

                    setShorterFormat: function (dataType) {
                        currentFormats[dataType] = Math.min(FORMATS[dataType].length - 1, currentFormats[dataType] + 1);
                    },

                    setLongerFormat: function (dataType) {
                        currentFormats[dataType] = Math.max(0, currentFormats[dataType] - 1);
                    }
                };
            })();
        }
    };
})();