var config = {}

config.mongodb = {
    url: "10.21.16.236",
    port: 27017,
    dbname: "mstr"
};
config.kafka = {
    url: 'ts-rh64-4',
    port: '2181',
    topic: 'dossier'
};

module.exports = config;