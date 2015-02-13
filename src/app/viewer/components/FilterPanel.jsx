var React = require('react'),
    FilterPanelStore = require('../stores/FilterPanelStore');

/**
 * Retrieve the current TODO data from the TodoStore
 */
function getState() {
    return {
        isOpen: FilterPanelStore.isOpen
    };
}

var FilterPanel = React.createClass({

    getInitialState: function() {
        return getState();
    },

    componentDidMount: function() {
        FilterPanelStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        FilterPanelStore.removeChangeListener(this._onChange);
    },

    /**
     * @return {object}
     */
    render: function() {
        return (
            <div style="width:100px;height:100px;position:absolute;top:100px;left:100px;border:2px solid red;background-color:black;">
                OMG
            </div>
        );
    },

    /**
     * Event handler for 'change' events coming from the TodoStore
     */
    _onChange: function() {
        this.setState(getState());
    }

});

module.exports = FilterPanel;
