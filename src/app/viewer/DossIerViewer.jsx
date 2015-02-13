(function () {
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
                    <mstrX.ui.NavigationBar handleNagivationClick={this.handleClick.bind(this)}
                        title={model.getPageName()} leftItems={leftToolbarItems} rightItems={rightToolbarItems}/>
                    <div className="mstr-dossier-page">
                        <mstrX.app.viewer.viz.xtab.Xtab model={model} pageData={pageData}/>
                    </div>
                </div>
            );
        },

        handleClick: function handleClick(evtName) {
            if(this.model.handle(evtName)){
                
            }else{
                console.log("DossierViewer::handleClick - " + evtName);
            }
        }
    });

    /**
     * Root Dossier Viewer singleton that creates and renders the root markup for
     *
     * @class
     */
    mstrX.app.viewer.DossierViewer = {
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
})();