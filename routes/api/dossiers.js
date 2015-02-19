(function () {

    const HTTP_STATUS = require('http-status-codes'),
        MONGODB_COLLECTION_NAME = 'dossiers',
        USER_AGENT_SIRIUS_WORKSHOP = 1;

    var express = require('express'),
        mongoClient = require('mongodb').MongoClient,
        ObjectID = require('mongodb').ObjectID,
        router = express.Router(),
        app = require('../../app'),
        debug = require('debug')('SiriusNode'),
        fenceChecker = require('../module/fenceChecker');

    function getUserAgent(req) {
        return req.headers['user-agent'];
    }

    function isUserAgent(req, userAgent) {
        var reqUserAgent = getUserAgent(req);

        if (!reqUserAgent) return false;

        switch (userAgent) {
            case USER_AGENT_SIRIUS_WORKSHOP:
                if (reqUserAgent.indexOf("SiriusWorkshop") >= 0 || (reqUserAgent.indexOf("AppleWebKit") >= 0 && (reqUserAgent.indexOf("Safari") < 0 && reqUserAgent.indexOf("Chrome") < 0))) {
                    return true;
                }
        }
        return false;
    }

    router.delete('/:name', function (req, res) {

        var mstrdb = app.get("mstrdb"),
            dossierName = req.params.name,
            query = [];

        if (dossierName === undefined) {
            res.status(HTTP_STATUS.BAD_REQUEST).end();
            return;
        }

        query.push({
            "name": dossierName
        });
        try {
            query.push({
                "_id": new ObjectID(dossierName)
            });
        } catch (e) {}

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
            return;
        }

        mstrdb.collection(MONGODB_COLLECTION_NAME).remove({$or:query}, function (err, result) {
            if (err || !result) {
                //something went wrong, return 400
                res.status(HTTP_STATUS.BAD_REQUEST).json({"status":"error", "message": "No dossiers deleted."}).end();
            } else {
                //all good
                res.status(HTTP_STATUS.OK).json({"status":"success", "message": result + " dossier deleted."}).end();
            }
        });
    });

    /* POST dossiers. */
    router.post('/', function (req, res) {

        var mstrdb = app.get("mstrdb"),
            dossier = req.body,
            setTimestamp = function (dossierDefinition) {
                dossierDefinition["time_created"] = (new Date()).toISOString();
                dossierDefinition["time_modified"] = dossierDefinition["time_created"];
            };

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
        }

        mstrdb.collection(MONGODB_COLLECTION_NAME).ensureIndex({name: 1}, {unique: true}, function (err, result) {});

        if (dossier) {

            if (Array.isArray(dossier)) {
                dossier.forEach(function (singleDossier) {
                    setTimestamp(singleDossier);
                });
            } else {
                setTimestamp(dossier);
            }

            mstrdb.collection(MONGODB_COLLECTION_NAME).insert(dossier, {ordered: false}, function (err, result) {
                if (err) {
                    var error = {"status":"error", "message": "Unable to publish dossier."};

                    if (err.code === 11000) {
                        error.cause = "A dossier with the same name already exists in the catalog."
                    }
                    //something went wrong, return 400
                    res.status(HTTP_STATUS.BAD_REQUEST).json(error).end();
                } else {
                    var ids = [];
                    result.forEach(function (dossier) {
                        ids.push(dossier["_id"]);
                    });
                    //all good
                    res.status(HTTP_STATUS.OK).json({"status":"success", "message": "Dossier(s) created successfully.", "id-list": ids}).end();
                }
            });
        } else {
            //something went wrong, return 400
            res.status(HTTP_STATUS.BAD_REQUEST).json({"status":"error", "message": "Dossier definition not specified.", "id-list": ids}).end();
        }

    });

    router.put('/:name', function (req, res) {
        var mstrdb = app.get("mstrdb"),
            dossierName = req.params.name,
            data = req.body,
            timestampUpdate = {"time_modified": true},
            query = [];

        if (dossierName === undefined) {
            res.status(HTTP_STATUS.BAD_REQUEST).end();
            return;
        }

        query.push({
            "name": dossierName
        });
        try {
            query.push({
                "_id": new ObjectID(dossierName)
            });
        } catch (e) {}

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
            return;
        }

        if (data) {

            if (data["service.shared"]) {
                timestampUpdate["service.time_published"] = true;
            }

            mstrdb.collection(MONGODB_COLLECTION_NAME).update({$or:query}, {
                $currentDate: timestampUpdate,
                $set: data
            }, {w:1}, function (err, result) {
                if (err || !result) {
                    //something went wrong, return 400
                    res.status(HTTP_STATUS.BAD_REQUEST).json({"status":"error", "message": "No dossiers updated."}).end();
                } else {
                    //all good
                    res.status(HTTP_STATUS.OK).json({"status":"success", "message": result + " dossier updated."}).end();
                }
            });
        } else {
            //something went wrong, return 400
            res.status(HTTP_STATUS.BAD_REQUEST).end();
        }


    });

    /* GET dossiers. */
    router.get('/:name?/:edge?', function(req, res) {

        var dossierName = req.params.name,
            edge = req.params.edge,
            mstrdb = app.get("mstrdb"),
            query,
            findFunction = "find",
            knownEdges = ["time_modified"];

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
        }

        //setup the query criteria
        if (dossierName !== undefined) {
            query = [];
            query.push({
                "name": {
                    $regex: "^" + dossierName,
                    $options: 'i'
                }
            });
            try {
                query.push({
                    "_id": new ObjectID(dossierName)
                });
            } catch (e) {}

            //if we are looking for only one record, switch the function to findOne.
            findFunction = "findOne";
            if (query.length > 1) {
                query = {
                    $or: query
                };
            } else {
                query = query[0];
            }
        } else {
            query = {};
        }


        var processResult = function (result) {

            //if the result is a collection of dossiers, convert it to array before sending the response back
            if (result.toArray) {
                result.toArray(function (err, dossiers) {
                    //res.json(dossiers.filter(function (dossier) { //ignore fencing for now
                    //    return fenceChecker.validateFencing(req.connection.remoteAddress, dossier);
                    //}));
                    res.json(dossiers);
                });
            } else {
                if (isUserAgent(req, USER_AGENT_SIRIUS_WORKSHOP) || fenceChecker.validateFencing(req.connection.remoteAddress, result)) {
                    if (edge !== undefined && knownEdges.indexOf(edge) >= 0) {

                        var jsonResponse = {
                            "_id": result["_id"]
                        };

                        jsonResponse[edge] = result[edge] !== undefined ? result[edge] : "";

                        res.json(jsonResponse);
                    } else {
                        res.json(result);
                    }
                } else {
                    res.json({"status":"error", "message":"outside fence"});
                }
            }
        }

        //find the first dossier that matches the name
        mstrdb.collection(MONGODB_COLLECTION_NAME)[findFunction](query, function (err, result) {
            if (err) {
                debug(err);
            }

            if (result) {

                processResult(result);

            } else {
                //if the query did not find results, or the database is empty, return 404
                res.status(HTTP_STATUS.NOT_FOUND).json({"status":"error", "message":"Dossier not found"}).end()
            }
        });

    });

    module.exports = router;

})();


