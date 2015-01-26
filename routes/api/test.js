(function () {

    var express = require('express'),
        router = express.Router(),
        path = require('path');

    /* GET test page. */
    router.get('/', function (req, res) {

        //send the test html, nothing else to do
        res.sendFile("test.html", {root: path.join(__dirname, '../../public')});

    });

    module.exports = router;

})();


