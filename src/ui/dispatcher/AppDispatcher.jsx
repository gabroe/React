var _ = require("underscore"),
    Dispatcher = require('flux').Dispatcher,
    d = new Dispatcher();

d.dispatch = _.wrap(d.dispatch, function(dispatch, actionType, payload){
    dispatch.call(d, {
        actionType : actionType,
        props : payload
    });
});

module.exports = d;
