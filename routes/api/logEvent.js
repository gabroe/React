(function () {

    var express = require('express'),
        router = express.Router(),
        path = require('path'),
        evtLogger = require('../module/EventLogger').getInstance();

    /* GET test page. */
    router.get('/', function(req, res) {
        var msg = req.param.msg || req.query.msg ;
        if (msg) {
            evtLogger.log(JSON.parse(msg), req);
            res.json({status: 'OK', message: msg});
        } else {
            res.json({status: 'Error', errMsg: 'no message to log.'});
        }

    });

    module.exports = router;

})();
