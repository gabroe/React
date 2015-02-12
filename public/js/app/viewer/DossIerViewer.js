(function () {

    var React = require('react'),
        NavigationBar = require('../../ui/NavigationBar'),
        Xtab = require('./viz/xtab/Xtab');

    var Viewer = React.createClass({displayName: "Viewer",
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
                React.createElement("div", {id: "mstr-dossier-viewer"}, 
                    React.createElement(NavigationBar, {handleNagivationClick: this.handleClick.bind(this), 
                        title: model.getPageName(), leftItems: leftToolbarItems, rightItems: rightToolbarItems}), 
                    React.createElement("div", {className: "mstr-dossier-page"}, 
                        React.createElement(Xtab, {model: model, pageData: pageData})
                    )
                )
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
                    React.createElement(Viewer, {model: model}),
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