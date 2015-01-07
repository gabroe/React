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
        count = function(groupby, target) {
            var msgs = EventMonitor.getTable(), // should i clone it?
                meta = EventMonitor.getTableMeta(),
                counts,
                walk = function (h, depth) {
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
                                walk(h[k], (depth + 1));
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
                        if (meta[depth + 1] == target) { // next will be target level, we need to get count
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
            walk(msgs, 0);
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
        res.json({result:count(req.param('groupby'), null)});
    });

    /**
     * Return the count of users -- equivalent to how many distinguish ips in system
     */
    router.get('/count/user', function(req, res) {
        res.json({result:count(req.param('groupby'), 'ip')});
    });

    router.get('/count', function(req, res) {
        res.json(EventMonitor.getAggregationTable());
    });

    module.exports = router;

})();