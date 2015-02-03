/**
 * Created by ewang on 1/21/2015.
 */

(function () {
    var KafkaMongoDBConsumer = function () {
        var kafkaCfg = require("../../config").kafka,
            kafkaDBCfg = kafkaCfg.mongodb,
            kafka = require("kafka-node"),
            kafkaClient = new kafka.Client(kafkaCfg.url + ':' + kafkaCfg.port),
            consumer,
            MongoClient = require("mongodb").MongoClient,
            mDB,
            tempCache = [],
            dumpDelay = kafkaDBCfg.delay || 1000; // dump tempCache to mongodb every x ms

        // create consumer first to return. Later we will set it up and start to listening
        consumer = new kafka.Consumer(
            kafkaClient,
            [
                {topic: kafkaCfg.topic, partition: kafkaCfg.partition}
            ],
            {
                fetchMaxBytes: kafkaCfg.fetchMaxBytes,
                fromOffset: true
            }
        );

        // pause consumer, since we have not found out the offset
        consumer.pause();

        kafkaClient.on("ready", function () {
            MongoClient.connect("mongodb://" + kafkaDBCfg.url + ":" + kafkaDBCfg.port + "/" + kafkaDBCfg.dbname, function (err, db) {
                if (err) {
                    console.log("Failed to connect to " + "mongodb://" + kafkaDBCfg.url + ":" + kafkaDBCfg + "/" + kafkaDBCfg.dbname);
                    throw err;
                }
                mDB = db;
                // 1. found the biggest offset from MongoClient
                db.collection("log").find({}).sort({offset: -1}).limit(1).toArray(function (err, docs) {
                    var logOffset = 0;
                    if (err) {
                        console.log(err);
                    }
                    var doc;
                    if (docs && docs.length === 1) {
                        doc = docs[0];
                    }
                    if (doc) {
                        logOffset = doc.offset + 1;
                    }

                    console.log("start to port data from offset:" + logOffset);
                    // 2. create kafka consumer set up offset
                    consumer.setOffset(kafkaCfg.topic, kafkaCfg.partition, logOffset);
                    consumer.resume();

                    // 3. for incomoing msg queue it in temporary cache
                    consumer.on("message", function (msg) {
                        console.log("MongoDB consumer - got message: " + msg.offset);
                        var log = JSON.parse(msg.value);
                        // mark offset for each message and
                        log.offset = msg.offset;
                        // NOTE: to avoid multiple servers writing to mongodb for the same log, we use offset + timestamp as id
                        // therefore, for the same log, even two servers try to put it at the same time to database, only one should succeed.
                        // we can not use check offset then update, since mongo does not provide transaction and we can not perform it in an atomic fashion.
                        // we used both offset and timestamp, instead of offset only, because we are afraid kafka will recycle offset when it gets really big
                        log._id = msg.offset + log.timestamp;
                        tempCache.push(log);
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


                    // 4. start a timer to dump accumulated logs into mongo db "kafka" collection
                    setInterval(function () {
                        if (tempCache && tempCache.length) {
                            var len = tempCache.length;
                            // insert
                            db.collection("log").insert(tempCache, function (err, doc) {
                                if (err) {
                                    console.log("error in saving to mongodb. " + err.message);
                                } else {
                                    console.log(len + " logs have been saved.");
                                }
                            });
                            // reset tempCache
                            tempCache = [];
                        }
                    }, dumpDelay);

                });

            });
        });
        return consumer;
    }
    module.exports = KafkaMongoDBConsumer;
}) ();
