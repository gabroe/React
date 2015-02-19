var React = require('react');
var Dispatcher = require('../../../ui/dispatcher/AppDispatcher');
var Popup = require('../../../ui/components/Popup');
var FilterActions = require('../actions/FilterPanelActions')

var FilterPanel = React.createClass({

    getState : function(){
        var store = this.props.store;
        return {
            show : !!store.show,
            anchor : store.anchor,
            offset : store.offset
        };
    },

    getInitialState: function() {
        return this.getState();
    },

    componentDidMount: function() {
        this.props.store.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        this.props.store.removeChangeListener(this._onChange);
    },

    /**
     * @return {object}
     */
    render: function() {
        var state = this.getState();
        return (
            <Popup
                class = {"mstr-filterPanel"}
                show = {state.show}
                onClose = {this._onClose}
                anchor = {state.anchor}
                offset = {state.offset}>

                <div>Filter Panel</div>
            </Popup>
        );
    },

    /**
     * Event handler for 'change' events coming from the TodoStore
     */
    _onChange: function() {
        this.setState(this.getState());
    },

    _onClose : function(){
        Dispatcher.dispatch(FilterActions.FILTER_PANEL_CLOSE);
    }


});

module.exports = FilterPanel;
