(function () {

    const HTTP_STATUS = require('http-status-codes'),
        MONGODB_COLLECTION_NAME = 'dossiers';

    var express = require('express'),
        mongoClient = require('mongodb').MongoClient,
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

                    dossier["time_created"] = (new Date()).toISOString();
                    dossier["time_modified"] = dossier["time_created"];

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
            data = req.body,
            timestampUpdate = {"time_modified": true};

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

        if (data) {

            if (data["service.shared"]) {
                timestampUpdate["service.time_published"] = true;
            }

            mstrdb.collection(MONGODB_COLLECTION_NAME).update({name: dossierName}, {
                $currentDate: timestampUpdate,
                $set: data
            }, {w:1}, function (err, result) {
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

            } else {
                //if the query did not find results, or the database is empty, return 404
                res.status(HTTP_STATUS.NOT_FOUND).end()
            }
        });

    });

    module.exports = router;

})();


