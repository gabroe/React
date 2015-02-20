var AppDispatcher = require('../../../ui/dispatcher/AppDispatcher');
var FilterPanelActions = require('./../actions/FilterPanelActions');

//Required react components on this app
require('./../stores/FilterPanelStore');

(function () {

    var React = require('react'),
        NavigationBar = require('../../../ui/NavigationBar'),
        Xtab = require('./xtab/Xtab');

    var Viewer = React.createClass({
        getInitialState: function getInitialState() {
            return this.props;
        },

        render: function render() {
            var model = this.state.model,
                pageData = model.get('pageData'),
                leftToolbarItems = [{
                    cmd: 'dossier'
                }],
                rightToolbarItems = [{
                    cmd: 'search'
                }, {
                    cmd: 'filter'
                }, {
                    cmd: 'sort'
                },  {
                    cmd: 'share'
                }];

            return (
                <div id="mstr-dossier-viewer">
                    <NavigationBar handleNagivationClick={this.handleClick.bind(this)}
                        title={model.getPageName()} leftItems={leftToolbarItems} rightItems={rightToolbarItems}/>
                    <div className="mstr-dossier-page">
                        <Xtab model={model} pageData={pageData}/>
                    </div>
                </div>
            );
        },

        handleClick: function handleClick(evtName, evt) {
            if(evtName === "filter"){
                AppDispatcher.dispatch(FilterPanelActions.FILTER_PANEL_OPEN, {
                    anchor : evt.target,
                    offset : {left : -80, top : 30}
                });
            }
        }
    });

    /**
     * Root Dossier Viewer singleton that creates and renders the root markup for
     *
     * @class
     */
    var DossierViewer = {
        /**
         *
         * @param {mstrX.app.viewer.DossierModel} model
         */
        start: function start(model) {
            var view = this.view;

            // Cache the model on the Dossier Viewer.
            this.model = model;

            if (!view) {
                this.view = React.render(
                    <Viewer model={model}/>,
                    document.body
                );
            } else {
                view.setState({
                    model: model
                });
                //
                //// Trigger the update view event and pass a copy of the data.
                //model.trigger('updateView', model.get("pageData"));
            }
        }
    }

    module.exports = DossierViewer;
})();