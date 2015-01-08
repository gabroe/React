(function () {

    const HTTP_STATUS = require('http-status-codes');

    var pg = require('pg'),
        express = require('express'),
        router = express.Router(),
        cache = {},
        windowSize = 1000,
        dataTypes = {
            undefined: -1,
            date: 1,
            geo: {
                state: 2
            },
            name: 3,
            text: 4
        };

    var conString = "postgres://jlebrun:jLebrun1@labs-cluster.chvvaq8wng8j.us-east-1.redshift.amazonaws.com:5439/jlebrun",
        headerMap = {
            "salesforcelead": {"name": "Salesforce Lead", type: dataTypes.name},
            "leadrole": {"name": "Lead Role", type: dataTypes.text},
            "company": {"name": "Company", type: dataTypes.text},
            "score": {"name": "Score", type: dataTypes.text},
            "mqldate": {"name": "MQL Date", type: dataTypes.date},
            "qualificationlevel": {"name": "Qualification Level", type: dataTypes.text},
            "interestlevel": {"name": "Interest Level", type: dataTypes.text},
            "leadsource": {"name": "Lead Source", type: dataTypes.text},
            "bdr": {"name": "BDR", type: dataTypes.name},
            "assignedae": {"name": "Assigned AE", type: dataTypes.name},
            "leadstatus": {"name": "Lead Status", type: dataTypes.text},
            "country": {"name": "Country", type: dataTypes.text},
            "state": {"name": "State", type: dataTypes.geo.state},
            "city": {"name": "City", type: dataTypes.text},
            "qualificationdate": {"name": "Qualification Date", type: dataTypes.date},
            "conversiondate": {"name": "Conversion Date", type: dataTypes.date},
            "acceptancedate": {"name": "Acceptance Date", type: dataTypes.date},
            "rating": {"name": "Rating", type: dataTypes.text},
            "level": {"name": "Level", type: dataTypes.text},
            "interest": {"name": "Interest", type: dataTypes.text},
            "lead": {"name": "Lead", type: dataTypes.name},
            "leadtitle": {"name": "Lead Title", type: dataTypes.text},
            "profilecompleteness": {"name": "Profile Completeness", type: dataTypes.text},
            "username": {"name": "User Name", type: dataTypes.name},
            "userid": {"name": "User ID", type: dataTypes.text},
            "dayofweek": {"name": "Day of Week", type: dataTypes.text},
            "hourofday": {"name": "Hour of Day", type: dataTypes.text},
            "numaction": {"name": "Action", type: dataTypes.text},
            "avgtime": {"name": "Average Time", type: dataTypes.text},
            "successrate": {"name": "Success Rate", type: dataTypes.text}
        },
        tables = [
            "lead",
            "QualifiedLeadslast7days",
            "AcceptedLeadslast7days",
            "ConvertedLeadslast7days",
            "leadsmqllast7days1000",
            "leadsmqllast7days10000",
            "leadsmqllast7days100000",
            "leadsbymqldate",
            "useractiontime"
        ];

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
            var headerDefinition = headerMap[element.name],
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

    function validateRequest(request) {
        var requestParams = request.params,
            table = requestParams.table,
            page = parseInt(requestParams.page || 0, 10);

        //if (tables.indexOf(table) < 0) {
        //    //the requested table is missing or invalid
        //    return HTTP_STATUS.NOT_FOUND;
        //}

        //check whether the requested page is valid
        if (cache[table]) {

            if (page >= Math.ceil(cache[table].window.trc / windowSize)) {
                return HTTP_STATUS.NOT_FOUND;
            }
        }
        return HTTP_STATUS.OK;

    };

    function buildResponseFromCache(table, page) {
        var response = {},
            cachedResults = cache[table];

        response.header = cachedResults.header;
        response.rows = cachedResults.pages[page];
        response.defn = cachedResults.defn;
        response.window = cachedResults.window;
        response.window.cp = page;
        response.window.prc = response.rows.length;

        return response;
    }

    /* GET data result. */
    router.get('/:table/:page?', function (req, res) {

        var table = req.params.table,
            page = parseInt(req.params.page || 0, 10),
            responseStatus = validateRequest(req);

        if (responseStatus != HTTP_STATUS.OK) {
            res.status(responseStatus).end();
        }

        if (cache[table]) {

            res.end(JSON.stringify(buildResponseFromCache(table, page)));
            return;
        }

        var client = new pg.Client(conString);

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
                cache[table] = convertToJSON(result);

                res.end(JSON.stringify(buildResponseFromCache(table, page)));

                client.end();
            });
        });
    });

    module.exports = router;

})();