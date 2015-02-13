var AppDispatcher = require('../../dispatcher/AppDispatcher'),
    FilterPanelActions = require('../actions/FilterPanelActions'),
    Store = require("../../../ui/stores/Store");


var FilterPanelStore = Store.extend({
    isOpen : false
});

// Register callback to handle all updates
AppDispatcher.register(function(action) {
    var text;

    switch(action.actionType) {
        case FilterPanelActions.OPEN:
            FilterPanelStore.isOpen = false;
            FilterPanelStore.emitChange();
            break;

        default:
        // no op
    }
});

module.exports = FilterPanelStore;
