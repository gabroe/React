/**
 * Created by ewang on 12/11/2014.
 */
(function () {

    var express = require('express'),
        app = require('../../app'),
        config = require('../../config'),
        kafka = require('kafka-node'),
        EventMonitor = require('../module/EventMonitor'),
        router = express.Router();

    /* GET home page. */
    router.get('/', function (req, res) {
        res.json(EventMonitor.getEvents());
        //        var kafkaCfg = config.kafka,
        //            kafkaClient = new kafka.Client(kafkaCfg.url + ':' + kafkaCfg.port);
        //            consumer = new kafka.Consumer(
        //                kafkaClient,
        //                [
        //                    { topic: kafkaCfg.topic, partition: 0 }
        //                ],
        //                {
        //                    autoCommit: false
        //                }
        //            );
        //        var messages=[];
        //        consumer.on('message', function (message) {
        //            messages.push(message.value);
        //        });
        //
        //        // wait for a minute to collect all messages
        //        setTimeout(function() {
        //            res.json({topic: kafkaCfg.topic, count: messages.length, messages: messages});
        //        }, 1000);

    });
    /**
     * return the count of ips
     */
    router.get('/count/ip', function(req, res) {
        var msgs = EventMonitor.getTable(), // should i clone it?
            meta = EventMonitor.getTableMeta(),
            groupby = req.param('groupby'),
            counts = {},
            walk = function (h, depth) {
              if (meta[depth] == groupby)  { // at correct group by level
                  // sum counts for this groupby
                  for (var j in h) {
                      if (!counts[j]) {
                          counts[j] = 0;
                      }
                      counts[j] += sumCount(h[j]);
                  }
              } else {
                  for (var k in h) {
                      walk(h[k], (depth + 1));
                  }
              }
            },
            sumCount = function (h) {
                if (h.hasOwnProperty('count')) {
                    return h.count;
                } else {
                    var count = 0;
                    for (var k1 in h) {
                        count = count + sumCount(h[k1]);
                    }
                    return count;
                }
            };
        // walk down the msgs
        walk(msgs, 0);
        res.json(counts);
    });

    router.get('/count', function(req, res) {
        res.json(EventMonitor.getAggregationTable());
    });

    module.exports = router;

})();