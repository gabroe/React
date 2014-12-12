/**
 * Created by ewang on 12/10/2014.
 */
(function() {
    var config = require('../../config'),
        kafka = require('kafka-node'),

        // local aggregation cache
        totalCount = 0,
        userCount = {},
        osCount = {}
        cache=[];
    var EventMonitor = {
        start: function() {
            var kafkaCfg = config.kafka,
                kafkaClient = new kafka.Client(kafkaCfg.url + ':' + kafkaCfg.port);
            consumer = new kafka.Consumer(
                kafkaClient,
                [
                    { topic: kafkaCfg.topic, partition: 0 }
                ],
                {
                    autoCommit: false
                }
            );
            var messages=[];
            consumer.on('message', function (message) {
                var m = JSON.parse(message.value);
                cache.push(m);
                totalCount ++;
                var ip = m.client.ip;
                // user count
                if (!userCount[ip]) {
                    userCount[ip] = 1;
                } else {
                    userCount[ip]++;
                }
                // os count
                var os = m.client.os.name;
                if (!osCount[os]) {
                    osCount[os] = 1;
                }else {
                    osCount[os] ++;
                }
            });

        },
        getCount: function() {
            return {
                total: totalCount,
                user: userCount,
                os: osCount
            };
        },
        getEvents: function() {
            return {
                total: totalCount,
                user: userCount,
                os: osCount,
                messages: cache
            };
        }
    }

    module.exports = EventMonitor;
})();
