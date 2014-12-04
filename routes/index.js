(function () {

    var express = require('express'),
        router = express.Router();

    /* GET home page. */
    router.get('/', function (req, res) {

      //redirect to the dossier viewer by default
      res.redirect('/dossier');
    });

    module.exports = router;

})();
