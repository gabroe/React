(function () {

    var React = require('react');

    function getItemMarkupFn(itemObj) {
        var itemClassName = "mstr-nav-icon mstr-nav-icon-" + itemObj.cmd;

        return (
            React.createElement("li", {className: "mstr-navbar-item"}, 
                React.createElement("span", {className: itemClassName, onClick: this.props.handleNagivationClick.bind(undefined, itemObj.cmd)})
            )
        );
    }

    /**
     * The navigation bar component for a dossier page viewer.
     *
     * @class
     */
    var NavigationBar = React.createClass({displayName: "NavigationBar",
        render: function render() {
            var leftNavItems = (this.props.leftItems || []).map(getItemMarkupFn.bind(this)),
                rightNavItems = (this.props.rightItems || []).map(getItemMarkupFn.bind(this));

            return (
                React.createElement("div", {className: "mstr-navbar mstrX clearfix"}, 
                    React.createElement("ul", {className: "nav navbar-nav"}, 
                        leftNavItems
                    ), 
                    React.createElement("ul", {className: "navbar-text"}, this.props.title), 
                    React.createElement("ul", {className: "nav navbar-nav navbar-right"}, 
                        rightNavItems
                    )
                )
            );
        }
    });

    module.exports = NavigationBar;

})();