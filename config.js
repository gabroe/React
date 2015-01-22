var config = {}

config.mongodb = {
    url: "10.21.16.125",
    port: 27017,
    dbname: "mstr"
};
config.kafka = {
    url: '10.27.31.80',
    port: '2181',
    topic: 'dossier',
    partition: 0,
    mongodb: {
        url: "10.21.16.225",
        port: 27017,
        dbname: "eventing",
        delay: 1000
    }
};

module.exports = config;