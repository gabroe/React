(function () {

    const HTTP_STATUS = require('http-status-codes'),
        MONGODB_COLLECTION_NAME = 'dossiers';

    var express = require('express'),
        mongoClient = require('mongodb').MongoClient,
        router = express.Router(),
        app = require('../../app'),
        debug = require('debug')('SiriusNode');

    router.delete('/:name', function (req, res) {

        var mstrdb = app.get("mstrdb"),
            dossierName = req.params.name;

        if (dossierName === undefined) {
            res.status(HTTP_STATUS.BAD_REQUEST).end();
            return;
        }

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
            return;
        }

        mstrdb.collection(MONGODB_COLLECTION_NAME).remove({name: dossierName}, function (err, result) {
            if (err) {
                //something went wrong, return 400
                res.status(HTTP_STATUS.BAD_REQUEST).end();
            } else {
                //all good
                res.status(HTTP_STATUS.OK).end();
            }
        });
    });

    /* POST dossiers. */
    router.post('/', function (req, res) {

        var mstrdb = app.get("mstrdb"),
            dossier = req.body;

        debug(req.body);

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
        }

        if (dossier && dossier.name !== undefined) {

            mstrdb.collection(MONGODB_COLLECTION_NAME).findOne({name: dossier.name}, function (err, result) {
                if (!result) {
                    mstrdb.collection(MONGODB_COLLECTION_NAME).insert(dossier, {w:1}, function (err, result) {
                        if (err) {
                            //something went wrong, return 400
                            res.status(HTTP_STATUS.BAD_REQUEST).end();
                        } else {
                            //all good
                            res.status(HTTP_STATUS.OK).end();
                        }
                    });
                } else {
                    //dossier with given name already exists, prevent overwrite.
                    res.status(HTTP_STATUS.BAD_REQUEST).end();
                }
            });

        } else {
            //something went wrong, return 400
            res.status(HTTP_STATUS.BAD_REQUEST).end();
        }

    });

    router.put('/:name', function (req, res) {
        var mstrdb = app.get("mstrdb"),
            dossierName = req.params.name,
            dossier = req.body;

        if (dossierName === undefined) {
            res.status(HTTP_STATUS.BAD_REQUEST).end();
            return;
        }

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
            return;
        }

        if (dossier) {

            mstrdb.collection(MONGODB_COLLECTION_NAME).update({name: dossierName}, dossier, {w:1}, function (err, result) {
                if (err) {
                    //something went wrong, return 400
                    res.status(HTTP_STATUS.BAD_REQUEST).end();
                } else {
                    //all good
                    res.status(HTTP_STATUS.OK).end();
                }
            });
        } else {
            //something went wrong, return 400
            res.status(HTTP_STATUS.BAD_REQUEST).end();
        }


    });

    /* GET dossiers. */
    router.get('/:name?', function(req, res) {

        var dossierName = req.params.name,
            mstrdb = app.get("mstrdb"),
            query = {},
            findFunction = "find";

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
        }

        //setup the query criteria
        if (dossierName !== undefined) {
            query.name = {
                $regex: "^" + dossierName,
                $options: 'i'
            };
            //if we are looking for only one record, switch the function to findOne.
            findFunction = "findOne";
        }

        //find the first dossier that matches the name
        mstrdb.collection(MONGODB_COLLECTION_NAME)[findFunction](query, function (err, result) {
            if (err) {
                debug(err);
            }

            if (result) {

                //if the result is a collection of dossiers, convert it to array before sending the response back
                if (result.toArray) {
                    result.toArray(function (err, dossiers) {
                        res.json(dossiers);
                    });
                } else {
                    res.json(result);
                }

            } else {
                //if the query did not find results, or the database is empty, return 404
                res.status(HTTP_STATUS.NOT_FOUND).end()
            }
        });

    });

    module.exports = router;

})();


