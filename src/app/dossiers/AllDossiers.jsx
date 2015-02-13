(function () {
    /**
     * Dossier List to display a list of dossier items.
     *
     * @class
     */
    mstrX.app.dossiers.DossierList = React.createClass({
        render: function render() {
            var dossierItemNodes = this.props.data.map(function (dossierItem) {
                return (
                    <mstrX.app.dossiers.DossierItem item={dossierItem} name={dossierItem.name}>
                        {dossierItem.name}
                    </mstrX.app.dossiers.DossierItem>
                );
            });

            return (
                <div className="mstr-all-dossier-list clearfix">
                    {dossierItemNodes}
                </div>
            );
        }
    });

    /**
     * The component for rendering all the dossiers on the all page.
     *
     * @class
     */
    mstrX.app.dossiers.AllDossiersView = React.createClass({
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
                    <mstrX.ui.NavigationBar handleNagivationClick={this.handleClick.bind(this)} title="All Dossiers" rightItems={rightNavBarItems}/>
                    <mstrX.app.dossiers.DossierList data={this.state.data} />
                </div>
            );
        }
    });

    // Render the All Dossier view in the
    React.render(
        <mstrX.app.dossiers.AllDossiersView model={new mstrX.app.dossiers.AllDossierModel}/>,
        document.getElementById('mstr-all-dossiers')
    );
})();