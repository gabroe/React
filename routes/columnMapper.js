(function () {
    var dataTypes = {
        undefined: -1,
        date: 1,
        geo: {
            state: 2
        },
        name: 3,
        text: 4
    }

    var columnMapper = {
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
    }

    module.exports = columnMapper;
})();