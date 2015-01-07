/**
 * Created by ewang on 12/10/2014.
 */
(function() {
    var config = require('../../config'),
        kafka = require('kafka-node'),
        consumer = null,
        kafkaClient = null,
        // local aggregation cache
        totalCount = 0,
        userCount = {},
        osCount = {},
        //hash map to keep dossier - client (web/ios/desktop) - sub client (brower/(iphone/ipad)/(windows/mac)) - version info  - ip
        table = {},
        cache=[];
    var EventMonitor = {
        start: function() {
            var kafkaCfg = config.kafka;
            kafkaClient = new kafka.Client(kafkaCfg.url + ':' + kafkaCfg.port);
            kafkaClient.on('ready', function () {
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
                    console.log("got message: " + message);
                    var m = JSON.parse(message.value);
                    cache.push(m);
                    totalCount ++;
                    var dossier = m.msg.page,
                        c = m.client,
                        ip = c.ip,
                        os = c.os && c.os.name || "",
                        browser = c.browser && c.browser.name || '',
                        client = browser ? 'web' : 'mobile', // @todo for now we assume if not web, then it is mobile
                        subClient = browser ? browser : (os ? os : 'iphone');
                    if (!table[dossier]) {
                        table[dossier] = {};
                    }
                    if (!table[dossier][client]) {
                        table[dossier][client] = {};
                    }
                    if (!table[dossier][client][subClient]) {
                        table[dossier][client][subClient] = {};
                    }
                    if (!table[dossier][client][subClient][ip]) {
                        table[dossier][client][subClient][ip] = {count: 0};
                    }
                    table[dossier][client][subClient][ip].count ++;
                    // user count
                    if (!userCount[ip]) {
                        userCount[ip] = 1;
                    } else {
                        userCount[ip]++;
                    }
                    // os count
                    if (!osCount[os]) {
                        osCount[os] = 1;
                    }else {
                        osCount[os] ++;
                    }
                });
                var offset = new kafka.Offset(kafkaClient);
                consumer.on('offsetOutOfRange', function (topic) {
                    topic.maxNum = 2;
                    offset.fetch([topic], function (err, offsets) {
                        var min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
                        consumer.setOffset(topic.topic, topic.partition, min);
                    });
                });

                consumer.on('error', function (err) {
                    console.log('error', err);
                });

            });

        },
        stop: function () {
            if (consumer != null) {
                consumer.close();
            }
        },
        getTable: function () {
            return table;
        },
        getTableMeta: function () {
           return ['dossier', 'client', 'subClient', 'ip'];
        },
        getCount: function () {
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
        },
        getAggregationTable: function() {
            return table;
        }
    };

    module.exports = EventMonitor;
})();
