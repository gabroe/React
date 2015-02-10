(function () {

    var mongoClient = require('mongodb').MongoClient,

        config = require('./testConfig');

    //connect to the dossier repository, then start up the express server

    module.exports.dbconnect = function(app, done) {

        mongoClient.connect("mongodb://" + config.mongodb.url + ":" + config.mongodb.port + "/" + config.mongodb.dbname, function (err, database) {

            if (err) {

                debug(err);

            }

            var server,

                cleanup = function () {

                    server.close( function () {

                        // Close db connection if exists

                        if (database) {

                            database.close();

                        }

                        // stop event monitor

                        console.log("stop event monitor and logger");

                        process.exit();

                    });

                    setTimeout( function () {

                        process.exit(1);

                    }, 30 * 1000);

                };

            app.set('mstrdb', database);

            //clean up upon shutdown

            process.on('SIGINT', cleanup);

            process.on('SIGTERM', cleanup);

            done();

        });

    };

})();
