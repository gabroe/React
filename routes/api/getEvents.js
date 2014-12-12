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

    module.exports = router;

})();