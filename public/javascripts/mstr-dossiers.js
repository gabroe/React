(function () {
    window.mstrReact = {};

    // Testing mixin.
    mstrReact.DossierItemMixin = {
        goToPage: function goToPage(dossierName, index) {
            window.open("/dossier/" + dossierName + '#/' + index, "_self");
        }
    };


    // Individual dossier item.
    mstrReact.DossierItem = React.createClass({
        mixins: [mstrReact.DossierItemMixin],

        getDefaultProps: function() {
            return {
                lastUpdated: 'Last Updated: 2 days ago'
            };
        },

        handleClick: function handleClick(index, evt) {
            //debugger;
            this.goToPage(this.props.item.name, index);
            //window.open("/dossier/" + this.props.item.name + '#/' + index, "_self");
            return false;
        },

        render: function render() {
            var props = this.props;

            var dossierPageNodes = this.props.item.pages.map(function (dossierPage, index) {
                return (
                    <span title={"Navigate to page: " + dossierPage.name} className="item-page" onClick={this.handleClick.bind(this, index)}>
                    </span>
                );
            }, this);

            return (
                <a href={"/dossier/" + props.item.name}>
                    <div className="mstr-dossier-item">
                        <div className="item-icn"></div>
                        <div className="item-name">{props.item.name}</div>
                        <div className="item-upd">{props.lastUpdated}</div>
                        <div className="item-pages">{dossierPageNodes}</div>
                    </div>
                </a>
            );
        }
    });

    /**
     * Dossier List to display a list of dossier items.
     *
     */
    mstrReact.DossierList = React.createClass({
        render: function () {
            var dossierItemNodes = this.props.data.map(function (dossierItem) {
                return (
                    <mstrReact.DossierItem item={dossierItem} name={dossierItem.name}>
                        {dossierItem.name}
                    </mstrReact.DossierItem>
                );
            });

            return (
                <div className="mstr-all-dossier-list clearfix">
                    {dossierItemNodes}
                </div>
            );
        }
    });

    mstrReact.AllDossiersView = React.createClass({
        getInitialState: function () {
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
            $.ajax({
                url: '/api/dossiers',
                dataType: 'json',
                success: function (data) {
                    this.setState({
                        data: data
                    });

                }.bind(this),

                error: function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
            });
        },

        handleClick: function handleClick(btn, evt) {
            var newData = this.state.data.concat();

            // Handle event based on which button was clicked.
            switch (btn) {
            case 'sort':
                var sortValue = this.sortValue,
                    newSortValue = sortValue !== true;

                // Sort the array by name.
                newData.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                }, this);

                // Reverse the array if we're sorting ascending.
                if (newSortValue === false) {
                    newData.reverse();
                }

                this.sortValue = newSortValue;
                break;
            }

            // Set the new state on the view.
            this.setState({
                data: newData
            });
        },

        render: function render() {
            return (
                <div className="mstr-all-dossier-view">
                    <div className="mstr-navbar">
                        <ul className="navbar-text">All Dossiers</ul>
                        <ul className="nav navbar-nav navbar-right">
                            <li>
                                <span className="mstr-nav-icon mstr-nav-sort" onClick={this.handleClick.bind(this, 'sort')}></span>
                            </li>
                        </ul>
                    </div>
                    <mstrReact.DossierList data={this.state.data} />
                </div>
            );
        }
    });

    React.render(
        <mstrReact.AllDossiersView />,
        document.getElementById('mstr-all-dossiers')
    );
})();