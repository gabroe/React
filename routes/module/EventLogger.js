/**
 * EventLogger is a singleton for logging any event into a central logging system.
 *
 * Currently it will log it into
 */

(function() {
    var kafka = require('kafka-node'),
        config = require('../../config'),
        UAParser = require('ua-parser-js'),
        os = require('os'),
        // singleton
        inst = null,
        kafkaCfg = config.kafka,
        client = kafka.Client(kafkaCfg.url + ':' + kafkaCfg.port),
        producer = new kafka.Producer(client),
        hostname = '',
        ready = false;
    producer.on('ready', function () {
        ready = true;
        hostname = os.hostname() || '';
    });
    var EventLogger = {
        getInstance: function() {
            if (inst) {
                return inst;
            } else {
                // create singleton instance
                inst = {
                    log: function(msg, req) {
                        var parser = new UAParser();
                        parser.setUA(req.headers['user-agent']);
                        var client = parser.getResult();
                        client.ip = req.ip;
                        message = {
                            msg: msg,
                            timestamp: new Date().toString(),
                            host: hostname,
                            client: client
                        };
                        var payloads = [{
                            topic: kafkaCfg.topic,
                            messages:JSON.stringify(message)
                        }];
                        if (ready) {
                            producer.send(payloads, function (err, data) {
                                console.log(data);
                            });
                        } else {
                            console.log("Producer is not ready");
                            // TODO throw exception?
                        }
                    }
                };
                return inst;
            }
        }
    };
    module.exports = EventLogger;

}
)();