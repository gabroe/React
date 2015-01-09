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
        calculate = function(req, target, msgs, meta) {
            var groupbys = req.param('groupby') ? req.param('groupby').split(',') : null,
                counts,
                /**
                 * Returns the selector(s) from request object
                 * @param req {Object} request object
                 * @returns {{n: (string|*), v: *}}
                 */
                selector = function (req) {
                    for (var i in meta) {
                        if (req.param(meta[i])) {
                            return {n: meta[i], v: req.param(meta[i])};
                        }
                    }
                },
                groupPath = function(item, depth, gp) {
                    if (meta[depth] == groupbys[gp.length]) { // at correct group by level
                        return gp.concat([item])
                    } else {
                        return gp;
                    }
                },
                /**
                 * Walk down the JavaScript object to decide which part should be used for calculation, which part should not based on selector
                 * @param h {Object} the Javascript object (hash tree)
                 * @param depth {int} the depth in the hash tree, 0 - based
                 * @selector {Object} first version will be single selector, which is a JavaScript object of {n: //selector name, v: /selector value}
                 */
                walk = function(h, depth, selector, gp) {
                    if (!selector) { // no selector specified, calculate the whole tree
                        track(h, depth, gp);
                    } else {
                        // are we looking at the selector level
                        if (meta[depth] === selector.n) {
                            for (var k in h) {
                                if (k === selector.v) {
                                    track(h[k], depth + 1, groupPath(k, depth, gp));
                                }
                            }
                        } else {
                            for (var j in h) {
                                walk(h[j], depth + 1, selector, groupPath(j, depth, gp));
                            }
                        }
                    }
                },
                incrArray = function (arr, fields, initV, newV) {
                    a1 = arr,

                        c = 0;
                    for (var k in fields) {
                        if (!a1[fields[k]]) {
                            if (c != (fields.length - 1)) {
                                a1[fields[k]] = {};
                            } else {
                                a1[fields[k]] = initV;
                            }
                        }
                        if (c == (fields.length - 1)) {
                            a1[fields[k]] += newV;
                            return;
                        }
                        a1 = a1[fields[k]];
                        c++;
                    }
                    return a1;
                },
                track = function (h, depth, gp) {
                    // if no group by
                    if (!groupbys) {
                        for (var j in h) {
                            counts = counts + sumCount(h[j], depth + 1);
                        }

                    } else { // with group by
                        if (gp.length == groupbys.length) {
                            incrArray(counts, gp, 0, sumCount(h, depth));
                        } else {
                            for (var k in h) {
                                track(h[k], (depth + 1), groupPath(k, depth, gp));
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
            if (groupbys) {
                counts = {};
            } else {
                counts = 0;
            }

            walk(msgs, 0, selector(req), []);

            // wort counts

            return counts;
        },
        search = function (req) {
            return calculate(req, null, EventMonitor.getSearchCountTable(), ['dossier', 'pattern']);
        },
        // main function to walk through the events table to count
        count = function(req, target) {
            var msgs = EventMonitor.getHitCountTable(), // should i clone it?
                meta = EventMonitor.getHitCountTableMeta();
            return calculate(req, target, msgs, meta);
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

    router.get('/count/search', function(req, res) {
        res.json({result:search(req)});
    })
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