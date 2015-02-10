var config = {}

// replace the following ip to your test mongodb and kafka server

config.mongodb = {

    url: "10.27.17.12",

    port: 27017,

    dbname: "largedb"

};

config.kafka = {

    url: '10.27.31.80',

    port: '2181',

    topic: 'dossier'

};

module.exports = config;