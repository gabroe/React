(function () {
    // Testing mixin.
    mstrX.DossierItemMixin = {
        goToPage: function goToPage(dossierName, index) {
            window.open("/dossier/" + dossierName + '#/' + index, "_self");
        }
    };

    // Individual dossier item.
    mstrX.DossierItem = React.createClass({
        mixins: [mstrX.DossierItemMixin],

        getDefaultProps: function () {
            return {
                lastUpdated: 'Last Updated: 2 days ago'
            };
        },

        handleClick: function handleClick(evt) {
            this.goToPage(this.props.item.name, evt.target.getAttribute("data-idx") || 0);
        },

        render: function render() {
            var props = this.props,
                dossierItem = props.item;

            var dossierPageNodes = (dossierItem.pages || []).map(function (dossierPage, index) {
                return (
                    <span title={"Navigate to page: " + dossierPage.name} className="item-page" data-idx={index}>
                    </span>
                );
            }, this);

            return (
                <div className="mstr-dossier-item" onClick={this.handleClick.bind(this)}>
                    <div className="item-icn"></div>
                    <div className="item-name">{dossierItem.name}</div>
                    <div className="item-upd">{props.lastUpdated}</div>
                    <div className="item-pages">{dossierPageNodes}</div>
                </div>
            );
        }
    });

    /**
     * Dossier List to display a list of dossier items.
     *
     */
    mstrX.DossierList = React.createClass({
        render: function render() {
            var dossierItemNodes = this.props.data.map(function (dossierItem) {
                return (
                    <mstrX.DossierItem item={dossierItem} name={dossierItem.name}>
                        {dossierItem.name}
                    </mstrX.DossierItem>
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
     * The component for rendering all the dossiers on the
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
         * @see {http://facebook.github.io/react/docs/component-specs.html}
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
                    <mstrX.DossierList data={this.state.data} />
                </div>
            );
        }
    });

    React.render(
        <mstrX.app.dossiers.AllDossiersView model={new mstrX.app.dossiers.AllDossierModel}/>,
        document.getElementById('mstr-all-dossiers')
    );
})();