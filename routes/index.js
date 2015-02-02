(function () {

    var express = require('express'),
        router = express.Router();

    /* GET home page. */
    router.get('/', function (req, res) {
        //redirect to the all dossiers viewer by default
        res.redirect('/all');
    });

    module.exports = router;

})();
