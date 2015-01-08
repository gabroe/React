/**
 * Created by ewang on 12/11/2014.
 */
(function () {

    var express = require('express'),
        app = require('../../app'),
        config = require('../../config'),
        kafka = require('kafka-node'),
        EventMonitor = require('../module/EventMonitor'),
        router = express.Router(),
        // main function to walk through the events table to count
        count = function(req, target) {
            var groupby = req.param('groupby'),
                msgs = EventMonitor.getTable(), // should i clone it?
                meta = EventMonitor.getTableMeta(),
                counts,
                /**
                 * Returns the selector(s) from request object
                 * @param req {Object} request object
                 * @returns {{n: (string|*), v: *}}
                 */
                selector = function(req) {
                    for (i in meta) {
                        if (req.param(meta[i])) {
                            return {n: meta[i], v: req.param(meta[i])};
                        }
                    }
                },
                /**
                 * Walk down the JavaScript object to decide which part should be used for calculation, which part should not based on selector
                 * @param h {Object} the Javascript object (hash tree)
                 * @param depth {int} the depth in the hash tree, 0 - based
                 * @selector {Object} first version will be single selector, which is a JavaScript object of {n: //selector name, v: /selector value}
                 */
                walk = function(h, depth, selector) {
                    if (!selector) { // no selector specified, calculate the whole tree
                        track(h, depth);
                    } else {
                        // are we looking at the selector level
                        if (meta[depth] === selector.n) {
                            for (var k in h) {
                                if (k === selector.v) {
                                    track(h[k], depth + 1);
                                }
                            }
                        } else {
                            for (var j in h) {
                                walk(h[j], depth + 1, selector);
                            }
                        }
                    }
                },
                track = function (h, depth) {
                    // if no group by
                    if (!groupby) {
                        for (var j in h) {
                            counts = counts + sumCount(h[j], depth + 1);
                        }

                    } else { // with group by
                        if (meta[depth] == groupby)  { // at correct group by level
                            // sum counts for this groupby
                            for (var j in h) {
                                if (!counts[j]) {
                                    counts[j] = 0;
                                }
                                counts[j] += sumCount(h[j], depth + 1);
                            }
                        } else {
                            for (var k in h) {
                                track(h[k], (depth + 1));
                            }
                        }
                    }
                },
                sumChildren = function (h, depth) {
                    var count = 0;
                    for (var k1 in h) {
                        count = count + sumCount(h[k1], depth + 1);
                    }
                    return count;
                },
                sumCount = function (h, depth) {
                    if (target) { // has target
                        if (meta[depth] == target) { // next will be target level, we need to get count
                            return Object.keys(h).length;
                        } else {
                            return sumChildren(h, depth);
                        }
                    } else { // no target, just retrieve hit count
                        if (h.hasOwnProperty('count')) {
                            return h.count;
                        } else {
                            return sumChildren(h, depth);
                        }
                    }
                };
            // walk down the msgs
            if (groupby) {
                counts = {};
            } else {
                counts = 0;
            }
            walk(msgs, 0, selector(req));
            return counts;
        };


    /* GET home page. */
    router.get('/', function (req, res) {
        res.json(EventMonitor.getEvents());
    });
    /**
     * return the count of hits -- equivalent to messages logged
     */
    router.get('/count/hit', function(req, res) {
        res.json({result:count(req, null)});
    });

    /**
     * Return the count of users -- equivalent to how many distinguish ips in system
     */
    router.get('/count/user', function(req, res) {
        res.json({result:count(req, 'ip')});
    });

    router.get('/count', function(req, res) {
        res.json(EventMonitor.getAggregationTable());
    });

    module.exports = router;

})();