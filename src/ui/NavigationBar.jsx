(function () {
    function getItemMarkupFn(itemObj) {
        var itemClassName = "mstr-nav-icon mstr-nav-icon-" + itemObj.cmd;

        return (
            <li className="mstr-navbar-item">
                <span className={itemClassName} onClick={this.props.handleNagivationClick.bind(undefined, itemObj.cmd)}></span>
            </li>
        );
    }

    /**
     * The navigation bar component for a dossier page viewer.
     *
     * @class
     */
    mstrX.ui.NavigationBar = React.createClass({
        render: function render() {
            var leftNavItems = (this.props.leftItems || []).map(getItemMarkupFn.bind(this)),
                rightNavItems = (this.props.rightItems || []).map(getItemMarkupFn.bind(this));

            return (
                <div className="mstr-navbar mstrX clearfix">
                    <ul className="nav navbar-nav">
                        {leftNavItems}
                    </ul>
                    <ul className="navbar-text">{this.props.title}</ul>
                    <ul className="nav navbar-nav navbar-right">
                        {rightNavItems}
                    </ul>
                </div>
            );
        }
    });
})();