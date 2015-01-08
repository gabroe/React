(function () {

    const HTTP_STATUS = require('http-status-codes');

    var pg = require('pg'),
        express = require('express'),
        guid = require('guid'),
        columnMapper = require('./columnMapper'),
        router = express.Router(),
        cache = {connections: {}, tokens: {}},
        windowSize = 1000;

    function convertToJSON(queryResult) {

        var length = queryResult.rows.length,
            pages = Math.ceil(length / windowSize),
            data = {
                header: [],
                pages: [],
                window: {
                    trc: queryResult.rows.length,
                    tpc: pages
                },
                defn: {}
            },
            i;

        queryResult.fields.forEach(function (element) {
            var headerDefinition = columnMapper[element.name],
                headerName = (headerDefinition && headerDefinition.name) || element.name;

            data.header.push(headerName);
            if (headerDefinition) {
                data.defn[headerName] = (headerDefinition && headerDefinition.type) || datatypes.undefined;
            }
        });

        for (i = 0; i < pages; i++) {
            var rows = [];

            queryResult.rows.slice(i * windowSize, i * windowSize + windowSize).forEach(function (element) {
                var row = [];

                for (key in element) {
                    row.push(element[key]);
                }

                rows.push(row);
            });

            data.pages.push(rows);
        }

        return data;
    };

    function validateTableRequest(token, table, page) {
        var connectionString = cache.tokens[token],
            tableCache;

        //check whether the token is valid
        if (!connectionString) {
            return HTTP_STATUS.BAD_REQUEST;
        }

        tableCache = cache.connections[connectionString].tables[table];

        //check whether the requested page is valid
        if (tableCache) {

            if (page >= Math.ceil(tableCache.window.trc / windowSize)) {
                return HTTP_STATUS.NOT_FOUND;
            }
        }
        return HTTP_STATUS.OK;

    };

    function buildResponseFromCache(token, table, page) {
        var response = {},
            connectionString = cache.tokens[token],
            cachedResults = cache.connections[connectionString].tables[table];

        response.header = cachedResults.header;
        response.rows = cachedResults.pages[page];
        response.defn = cachedResults.defn;
        response.window = cachedResults.window;
        response.window.cp = page;
        response.window.prc = response.rows.length;

        return response;
    }

    function createNewSessionToken() {
        return guid.raw();
    }

    function getConnectionString(dbtype, params) {

        var connectionStringArray = [];

        connectionStringArray.push(dbtype);
        connectionStringArray.push("://");
        connectionStringArray.push(params.user);
        connectionStringArray.push(":");
        connectionStringArray.push(params.password);
        connectionStringArray.push("@");
        connectionStringArray.push(params.server);
        connectionStringArray.push(":");
        connectionStringArray.push(params.port);
        connectionStringArray.push("/");
        connectionStringArray.push(params.database);

        return connectionStringArray.join("");
    }

    router.get('/:dbtype/:action/:table?/:page?', function (req, res) {

        var action = req.params.action,
            connections = cache.connections,
            tokens = cache.tokens;

        switch (action) {
            case 'getToken':
                connectionString = getConnectionString(req.params.dbtype, req.query);

                if (!connections[connectionString]) {

                    connections[connectionString] = {token: createNewSessionToken(), tables: {}};
                }

                tokens[connections[connectionString].token] = connectionString;

                res.json({"data": {"database": req.query.database, "connection-token": connections[connectionString].token}});
                break;

            case 'tables':
                returnTableContents(req.query.token, req.params, res);
        }
    });

    function returnTableContents(token, params, res) {
        var table = params.table,
            page = parseInt(params.page || 0, 10),
            responseStatus = validateTableRequest(token, table, page),
            connectionString = cache.tokens[token],
            cachedTable;

        if (responseStatus != HTTP_STATUS.OK) {
            res.status(responseStatus).end();
        }

        cachedTable = cache.connections[connectionString].tables[table];

        if (cachedTable) {

            res.end(JSON.stringify(buildResponseFromCache(token, table, page)));
            return;
        }

        var client = new pg.Client(connectionString);

        client.connect(function (err) {

            if (err) {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
                return console.error('ERROR - could not connect to postgres', err);
            }

            client.query('SELECT * from ' + table, function (err, result) {

                if (err) {
                    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).end();
                    return console.error('ERROR - error running query', err);
                }

                //cache full result
                cache.connections[connectionString].tables[table] = convertToJSON(result);

                res.end(JSON.stringify(buildResponseFromCache(token, table, page)));

                client.end();
            });
        });
    }

    module.exports = router;

})();