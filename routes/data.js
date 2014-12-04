(function () {

    const HTTP_STATUS = require('http-status-codes');

    var pg = require('pg'),
        express = require('express'),
        router = express.Router(),
        cache = {},
        windowSize = 1000;

    var conString = "postgres://jlebrun:jLebrun1@labs-cluster.chvvaq8wng8j.us-east-1.redshift.amazonaws.com:5439/jlebrun",
        headerMap = {
            "salesforcelead": "Salesforce Lead",
            "leadrole": "Lead Role",
            "company": "Company",
            "score": "Score",
            "mqldate": "MQL Date",
            "qualificationlevel": "Qualification Level",
            "interestlevel": "Interest Level",
            "leadsource": "Lead Source",
            "bdr": "BDR",
            "assignedae": "Assigned AE",
            "leadstatus": "Lead Status",
            "country": "Country",
            "state": "State",
            "city": "City",
            "qualificationdate": "Qualification Date",
            "conversiondate": "Conversion Date",
            "acceptancedate": "Acceptance Date",
            "rating": "Rating",
            "level": "Level",
            "interest": "Interest",
            "lead": "Lead",
            "leadtitle": "Lead Title",
            "profilecompleteness": "Profile Completeness",
            "username": "User Name",
            "userid": "User ID",
            "dayofweek": "Day of Week",
            "hourofday": "Hour of Day",
            "numaction": "Action",
            "avgtime": "Average Time",
            "successrate": "Success Rate"
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
                defn: {
                    "Qualification Date": 1,
                    "Conversion Date": 1,
                    "MQL Date": 1,
                    "Acceptance Date": 1,
                    "State": 2
                }
            },
            i,
            j;

        queryResult.fields.forEach(function (element) {
            data.header.push(headerMap[element.name] || element.name);
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

        if (tables.indexOf(table) < 0) {
            //the requested table is missing or invalid
            return HTTP_STATUS.NOT_FOUND;
        }

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