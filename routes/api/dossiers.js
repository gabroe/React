(function () {

    const HTTP_STATUS = require('http-status-codes'),
        MONGODB_COLLECTION_NAME = 'dossiers';

    var express = require('express'),
        mongoClient = require('mongodb').MongoClient,
        ObjectID = require('mongodb').ObjectID,
        router = express.Router(),
        app = require('../../app'),
        debug = require('debug')('SiriusNode');

    function validateDateFence(dateArray) {
        var result = false,
            currentDate = new Date();

        if (dateArray && dateArray.length) {

            dateArray.forEach(function (date) {
                var dateMatchStart = true,
                    dateMatchEnd = true,
                    timeMatched = true;

                if (date.start) {
                    dateMatchStart = (currentDate >= (new Date(date.start)));
                }

                if (date.end) {
                    dateMatchEnd = (currentDate <= (new Date(date.end)));
                }

                if (date.time) {
                    timeMatched = validateTimeFence(date.time);
                }

                result |= dateMatchStart && dateMatchEnd && timeMatched;
            });

            return result;
        }
        return true;
    }

    function validateTimeFence(timeArray) {
        var result = false,
            currentTime = new Date();

        if (timeArray && timeArray.length) {

            timeArray.forEach(function (time) {
                var timeRange = time.split("-");

                if (timeRange.length === 2) {

                    var startTimeRestriction = timeRange[0].split(":"),
                        endTimeRestriction = timeRange[1].split(":"),
                        startTime = new Date(),
                        endTime = new Date(),
                        setupTime = function (time, timeRestriction) {
                            time.setHours(parseInt(timeRestriction[0], 10));
                            time.setMinutes(parseInt(timeRestriction[1], 10));
                        };


                    if (startTimeRestriction.length >= 2 && endTimeRestriction.length >=2) {
                        setupTime(startTime, startTimeRestriction);
                        setupTime(endTime, endTimeRestriction);

                        result |= (currentTime >= startTime && currentTime <= endTime);
                    }
                }
            });
            return result;
        }
        return true;
    }

    function validateIPFence(req, ipArray) {
        var remoteIP = req.connection.remoteAddress,
            regEx,
            result = false;

        if (remoteIP && ipArray && ipArray.length) {

            ipArray.forEach(function (ip) {
                regEx = new RegExp(ip.replace(".", "\\.").replace("*", "\\d*").replace("?", "\\d"));

                result |= regEx.test(remoteIP);
            });
            return result;
        }
        return true;
    }

    function validateFencing(req, fence) {
        if (!fence) {
            return true;
        }

        return validateIPFence(req, fence.ip) && validateTimeFence(fence.time) && validateDateFence(fence.date);
    }

    router.delete('/:name', function (req, res) {

        var mstrdb = app.get("mstrdb"),
            dossierName = req.params.name,
            query = {};

        if (dossierName === undefined) {
            res.status(HTTP_STATUS.BAD_REQUEST).end();
            return;
        }

        try {
            query["_id"] = new ObjectID(dossierName);
        } catch (e) {
            query.name = dossierName;
        }

        //no database connection available, return 500 error
        if (!mstrdb) {
            debug("MongoDB no connection available");
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
            return;
        }

        mstrdb.collection(MONGODB_COLLECTION_NAME).remove(query, function (err, result) {
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
            query = {};

        if (dossierName === undefined) {
            res.status(HTTP_STATUS.BAD_REQUEST).end();
            return;
        }

        try {
            query["_id"] = new ObjectID(dossierName);
        } catch (e) {
            query.name = dossierName;
        }

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

            mstrdb.collection(MONGODB_COLLECTION_NAME).update(query, {
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
            try {
                query["_id"] = new ObjectID(dossierName);
            } catch (e) {
                query.name = {
                    $regex: "^" + dossierName,
                    $options: 'i'
                }
            }
            //if we are looking for only one record, switch the function to findOne.
            findFunction = "findOne";
        }

        var processResult = function (result) {

            //if the result is a collection of dossiers, convert it to array before sending the response back
            if (result.toArray) {
                result.toArray(function (err, dossiers) {
                    res.json(dossiers.filter(function (dossier) {
                        return !dossier.service || !dossier.service.fence || validateFencing(req, dossier.service.fence)
                    }));
                });
            } else {
                if (!result.service || !result.service.fence || validateFencing(req, result.service.fence)) {
                    res.json(result);
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


