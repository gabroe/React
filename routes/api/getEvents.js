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
                sort = function (parent, n, depth, req) {
                    var h = parent[n],
                        sort = req.param('sort'),
                        asc = sort === 'asc' ? true : false,
                        bb = req.param('begin'),
                        be = req.param('end'),
                        sortFunc = function (t1, t2, asc) {
                            var v1 = t1.v,
                                v2 = t2.v;
                            return asc ? (v2 - v1) : (v1 - v2);
                        },
                        sortChild = function (parent, n, dp) {
                            var h = parent[n];
                            if (dp === (depth - 1)) { // stop at parent level to sort the correct level's content
                                var items = [];
                                for (var k in h) {
                                    items.push({n: k, v: h[k]});
                                }
                                items.sort(sortFunc);
                                // reset h
                                h = {};
                                // repopulate h
                                for (var i in items) {
                                    // only within the bb and be range if they specified. bb and be are 1-based
                                    if ((bb <= 0 || i >= (bb- 1)) && (be <= 0 || i <= (be - 1)) ) {
                                        h[items[i].n] = h[items[i].v];
                                    }
                                }
                                // assign back to parent
                                parent[n] = h;
                            } else {
                                for (var k in h) {
                                    sortChild(h, k, dp + 1);
                                }
                            }

                        };
                    if (sort) {
                        sortChild(parent, n, 0);
                    }
                    return parent[n];
                },
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
                            incrArray(counts, gp, 0, sumCount(h, depth, {}));
                        } else {
                            for (var k in h) {
                                track(h[k], (depth + 1), groupPath(k, depth, gp));
                            }
                        }
                    }
                },
                sumChildren = function (h, depth, col) {
                    var count = 0;
                    if (!target) {
                        for (var k1 in h) {
                            count = count + sumCount(h[k1], depth + 1, col);
                        }
                    } else {
                        for (var k1 in h) {
                            sumCount(h[k1], depth + 1, col);
                        }
                        count = Object.keys(col).length;
                    }
                    return count;
                },
                /**
                 * returns the count of the sub tree
                 * @param h subtree
                 * @param depth the depth in the levels
                 * @param col a cache collection to record distinguish targets. This is passed through whole tree traverse
                 * @returns {*}
                 */
                sumCount = function (h, depth, col) {
                    if (target) { // has target
                        if (meta[depth] == target) { // next will be target level, we need to get count
                            for (var k in h) {
                                col[k] = true;
                            }
                            return Object.keys(col).length;
                        } else {
                            return sumChildren(h, depth, col);
                        }
                    } else { // no target, just retrieve hit count
                        if (h.hasOwnProperty('count')) {
                            return h.count;
                        } else {
                            return sumChildren(h, depth, col);
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

            // sort counts
            if (groupbys) {
                counts = sort({v: counts}, 'v', groupbys.length, req);
            }
            return counts;
        },
        search = function (req) {
            return calculate(req, null, EventMonitor.getSearchCountTable(), ['dossier', 'pattern']);
        },
        // main function to walk through the events table to count
        count = function(req, target) {
            var msgs = EventMonitor.getHitCountTable(), // should i clone it?
                meta = EventMonitor.getHitCountTableMeta();
            var ret = calculate(req, target, msgs, meta);
            return ret;
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
     * Return the count of users -- equivalent to how many distinguish users in system
     */
    router.get('/count/user', function(req, res) {
        var ret = count(req, 'user');
        res.json({result: ret});
    });

    router.get('/count', function(req, res) {
        res.json(EventMonitor.getAggregationTable());
    });

    module.exports = router;

})();