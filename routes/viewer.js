(function () {

    const HTTP_STATUS = require('http-status-codes'),
        MONGODB_COLLECTION_NAME = 'dossiers';

    var express = require('express'),
        path = require('path'),
        app = require('../app'),
        url = require('url'),
        router = express.Router(),
        evtLogger = require('./module/EventLogger').getInstance(),
        debug = require('debug')('SiriusNode');

    /* GET dossier viewer page. */
    router.get('/:name?', function (req, res) {
        var mstrdb = app.get("mstrdb"),
            dossierName = req.params.name,
            queryObject = url.parse(req.url,true).query;

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

        } else if (queryObject.react) {
            console.log("react-test");

            // Log the dev
            evtLogger.log({
                action: "browse-react-viewer",
                page: dossierName
            }, req);

            //send the viewer html, nothing else to do
            res.sendFile("mstr-dossier-viewer.html", {root: path.join(__dirname, '../public')});

        } else {

            evtLogger.log({action: "browse", page: dossierName}, req);
            //send the viewer html, nothing else to do
            res.sendFile("mstr-viewer.html", {root: path.join(__dirname, '../public')});
            //res.send(dossierName);
        }
    });

    module.exports = router;

})();

