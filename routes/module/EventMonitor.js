/**
 * Created by ewang on 12/10/2014.
 */
(function() {
    var config = require('../../config'),
        kafka = require('kafka-node'),
        MongoDBConsumer = require('./KafkaMongoDBConsumer'),
        mongoDBConsumer = null,
        consumer = null,
        kafkaClient = null,
        // local aggregation cache
        totalCount = 0,
        userCount = {},
        osCount = {},
        //hash map to keep dossier - client (web/ios/desktop) - sub client (brower/(iphone/ipad)/(windows/mac)) - version info  - ip
        hitCountTbl = {},
        searchCountTbl = {},
        cache = [];
    var EventMonitor = {
        start: function() {
            var kafkaCfg = config.kafka;
            kafkaClient = new kafka.Client(kafkaCfg.url + ':' + kafkaCfg.port);
            kafkaClient.on('ready', function () {
                // start MongoDB consumer
                mongoDBConsumer = MongoDBConsumer();
                // start in memory consumer
                consumer = new kafka.Consumer(
                    kafkaClient,
                    [
                        { topic: kafkaCfg.topic, partition: 0, offset: 0 }
                    ],
                    {
                        fetchMaxBytes: kafkaCfg.fetchMaxBytes,
                        autoCommit: false,
                        fromOffset: true
                    }
                );


                var messages = [],
                    onBrowseMsg = function (m) {
                        var dossier = m.msg.page,
                            c = m.client,
                            user = c.ip,
                            os = c.os && c.os.name || "",
                            browser = (c.browser && c.browser.name) || '',
                            time = new Date(m.timestamp || null),
                            year = time.getFullYear(),
                            month = time.getMonth() + 1,
                            day = time.getDate(),
                            date = year + '-' + (month > 9 ? month : '0' + month) + '-' + (day > 9 ? day : '0' + day),
                            hour = time.getHours().toString(10),
                            client = browser ? 'web' : 'mobile', // @todo for now we assume if not web, then it is mobile
                            subClient = browser ? browser : (os ? os : 'iphone');
                        console.log('browser:' + browser + ' client:' + client);
                        if (!hitCountTbl[dossier]) {
                            hitCountTbl[dossier] = {};
                        }
                        if (!hitCountTbl[dossier][client]) {
                            hitCountTbl[dossier][client] = {};
                        }
                        if (!hitCountTbl[dossier][client][subClient]) {
                            hitCountTbl[dossier][client][subClient] = {};
                        }
                        if (!hitCountTbl[dossier][client][subClient][user]) {
                            hitCountTbl[dossier][client][subClient][user] = {};
                        }
                        if (!hitCountTbl[dossier][client][subClient][user][date]) {
                            hitCountTbl[dossier][client][subClient][user][date] = {};
                        }
                        if (!hitCountTbl[dossier][client][subClient][user][date][hour]) {
                            hitCountTbl[dossier][client][subClient][user][date][hour] = {count: 0};
                        }
                        hitCountTbl[dossier][client][subClient][user][date][hour].count++;
                    },
                    onSearchMsg = function (m) {
                        var dossier = m.msg.page,
                            c = m.client,
                            ip = c.ip,
                            os = c.os && c.os.name || "",
                            browser = c.browser && c.browser.name || '',
                            client = browser ? 'web' : 'mobile', // @todo for now we assume if not web, then it is mobile
                            subClient = browser ? browser : (os ? os : 'iphone'),
                            pattern = m.msg.pattern;
                        if (!searchCountTbl[dossier]) {
                            searchCountTbl[dossier] = {};
                        }
                        if (!searchCountTbl[dossier][pattern]) {
                            searchCountTbl[dossier][pattern] = {count: 0};
                        }
                        searchCountTbl[dossier][pattern].count++;
                    };
                consumer.on('message', function (message) {
                    console.log("got message: " + message.value);
                    var m = JSON.parse(message.value),
                        action = m.msg.action,
                        c = m.client,
                        user = c.ip,
                        os = c.os && c.os.name || "";
                    cache.push(m);
                    totalCount ++;
                    if (action == "browse" || action == "loaddata") {
                        onBrowseMsg(m);
                    } else if (action == "search") {
                      onSearchMsg(m);
                    } else {
                        console.log("unknown msg.");
                    }
                    // user count
                    if (!userCount[user]) {
                        userCount[user] = 1;
                    } else {
                        userCount[user]++;
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
            if (mongoDBConsumer) {
                mongoDBConsumer.close();
            }
        },
        getHitCountTable: function () {
            return hitCountTbl;
        },
        getHitCountTableMeta: function () {
           return ['dossier', 'client', 'subClient', 'user', 'date', 'hour'];
        },
        getSearchCountTable: function() {
            return searchCountTbl;
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
            return {hits: hitCountTbl, search: searchCountTbl};
        }
    };

    module.exports = EventMonitor;
})();
