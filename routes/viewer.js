(function () {

    const HTTP_STATUS = require('http-status-codes'),
        MONGODB_COLLECTION_NAME = 'dossiers';

    var express = require('express'),
        path = require('path'),
        app = require('../app'),
        router = express.Router(),
        evtLogger = require('./module/EventLogger').getInstance(),
        debug = require('debug')('SiriusNode');

    /* GET dossier viewer page. */
    router.get('/:name?', function (req, res) {

        var mstrdb = app.get("mstrdb"),
            dossierName = req.params.name;

        if (dossierName === undefined) {
            //no database connection available, return 500 error
            if (!mstrdb) {
                debug("MongoDB no connection available");
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
            }

            mstrdb.collection(MONGODB_COLLECTION_NAME).findOne({}, function (err, dossier) {
                if (err) {
                    debug(err);
                }

                if (dossier) {
                    res.redirect("/dossier/" + dossier.name);
                }
            });

        } else {

            evtLogger.log({action: "browse", page: dossierName}, req);
            //send the viewer html, nothing else to do
            res.sendFile("mstr-viewer.html", {root: path.join(__dirname, '../public')});
            //res.send(dossierName);
        }
    });

    module.exports = router;

})();

