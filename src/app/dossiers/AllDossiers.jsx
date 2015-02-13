(function () {

    var React = require('react'),
        NavigationBar = require('../../ui/NavigationBar'),
        DossierList = require('./DossierList'),
        AllDossierModel = require('./AllDossierModel');

    /**
     * The component for rendering all the dossiers on the all page.
     *
     * @class
     */
    var AllDossiersView = React.createClass({
        getInitialState: function getInitialState() {
            return {
                data: []
            };
        },

        /**
         * Called immediately after component rendering.
         *
         * @ignore
         */
        componentDidMount: function componentDidMount() {
            // Set up an event listener on the model to refresh view.
            this.props.model.on('updateView', function (data) {
                // Set the new state on the view.
                this.setState({
                    data: data
                });
            }.bind(this));
        },

        handleClick: function handleClick(evtName) {
            var newData = this.state.data.concat();

            // Handle event based on which button was clicked.
            switch (evtName) {
            case 'sort':
                this.props.model.sort(newData);
            }
        },

        render: function render() {
            var rightNavBarItems = [{
                cmd: 'sort'
            }];

            return (
                <div className="mstr-all-dossier-view">
                    <NavigationBar handleNagivationClick={this.handleClick.bind(this)} title="All Dossiers" rightItems={rightNavBarItems}/>
                    <DossierList data={this.state.data} />
                </div>
            );
        }
    });

    module.exports = AllDossiersView;

    // Render the All Dossier view in the
    React.render(
        <AllDossiersView model={new AllDossierModel}/>,
        document.getElementById('mstr-all-dossiers')
    );
})();