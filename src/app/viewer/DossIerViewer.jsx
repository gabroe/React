(function () {

    var React = require('react'),
        NavigationBar = require('../../ui/NavigationBar'),
        Xtab = require('./viz/xtab/Xtab');

    var Viewer = React.createClass({
        getInitialState: function getInitialState() {
            return this.props;
        },

        render: function render() {
            var model = this.state.model,
                pageData = model.get('pageData'),
                leftToolbarItems = [{
                    cmd: 'toc'
                }, {
                    cmd: 'share'
                }],
                rightToolbarItems = [{
                    cmd: 'filter'
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

        handleClick: function handleClick(evtName) {
            console.log("DossierViewer::handleClick - " + evtName);
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