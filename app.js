(function () {

    var express = require('express'),
        path = require('path'),
        favicon = require('serve-favicon'),
        logger = require('morgan'),
        cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser');

    var app = module.exports = express();

    var routes = require('./routes/index'),
        dossier = require('./routes/viewer'),
        dossiers = require('./routes/api/dossiers'),
        data = require('./routes/data'),
        redshift = require('./routes/redshift'),
        test = require('./routes/api/test'),
//        logViewerJSON = require('./routes/logViewer-JSON'),
//        logViewerBubble = require('./routes/logViewer-Bubble'),
//        logViewer = require('./routes/logViewer'),
        logEvent = require('./routes/api/logEvent'),
        getEvents = require('./routes/api/getEvents');

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    // @TODO: uncomment after placing favicon in /public
    //app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    //setup express routes
    app.use('/', routes);
    app.use('/redshift', redshift);
    app.use('/data', data);
    app.use('/dossier', dossier);
    app.use('/api/dossiers', dossiers);
    app.use('/api/test', test);
    app.use('/api/logEvent', logEvent);
    app.use('/api/getEvents', getEvents);
    app.use('/api/event', getEvents);
//    app.use('/logViewer', logViewer);
//    app.use('/logViewerJSON', logViewerJSON);
//    app.use('/logViewerBubble', logViewerBubble);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

})();


