var AppDispatcher = require('../../../ui/dispatcher/AppDispatcher'),
    FilterPanelActions = require('../actions/FilterPanelActions'),
    Store = require("../../../ui/stores/Store"),
    $ = require('jquery'),
    React = require('react');

var FilterPanelStore = new (Store.extend({
    isOpen : false
}))();

// Register callback to handle all updates
AppDispatcher.register(function(action) {
    if(!FilterPanelStore._widgetCreated){
        //$('<div>') can be used but using createElement is the fastest way to insert a div
        var pp = $(document.createElement('div')),
            FilterPanel = require('../components/FilterPanel');
        $('body').append(pp);

        React.render(
            <FilterPanel store = {FilterPanelStore}/>,
            pp[0]
        );
        FilterPanelStore._widgetCreated = true;
    }

    switch(action.actionType) {
        case FilterPanelActions.FILTER_PANEL_OPEN:
            FilterPanelStore.show = true;
            FilterPanelStore.anchor = action.props.anchor;
            FilterPanelStore.offset = action.props.offset;
            FilterPanelStore.emitChange();
            break;

        case FilterPanelActions.FILTER_PANEL_CLOSE:
            FilterPanelStore.show = false;
            FilterPanelStore.emitChange();
            break;

        default:
        // no op
    }
});

module.exports = FilterPanelStore;
