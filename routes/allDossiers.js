(function () {

    var express = require('express'),
        router = express.Router(),
        path = require('path');

    /* GET all dossiers home page. */
    router.get('/', function (req, res) {
        // Go to the all dossier test page.
        res.sendFile("all-dossiers.html", {
            root: path.join(__dirname, '../public')
        });
    });

    module.exports = router;

})();