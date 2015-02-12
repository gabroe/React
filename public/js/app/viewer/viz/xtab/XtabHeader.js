(function () {
    var React = require('react'),
        $FMT_MGR = require('../../../../util/formatManager');

    /**
     * Xtab Header Class.
     *
     * @class
     */
    var XtabHeader = React.createClass({displayName: "XtabHeader",
        render: function render() {
            var headerItems = this.props.headerItems,
                headerNodes = headerItems.map(function (headerName, idx) {
                    return (
                        React.createElement("th", {"data-idx": idx}, headerName)
                    );
                }),
                colNodes = headerItems.map(function () {
                    return (
                        React.createElement("col", null)
                    );
                }),
                tableHeaderStyle = $FMT_MGR.getStyle(this.props.model.get('data'), 'columnheader');

            return (
                React.createElement("div", {className: "mstr-xtab-header-container", onClick: this.handleClick.bind(this)}, 
                    React.createElement("table", {className: "table mstr-xtab header", style: tableHeaderStyle, ref: "headerTableNode"}, 
                        React.createElement("colgroup", null, 
                            colNodes
                        ), 
                        React.createElement("thead", null, 
                            React.createElement("tr", null, 
                                headerNodes
                            )
                        )
                    )
                )
            );
        },

        shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
            return !nextProps.incRender;
        },

        handleClick: function handleClick(evt) {
            this.props.model.sort($(evt.target).attr("data-idx"));
        },

        getHeaderTableNode: function () {
            return this.refs.headerTableNode.getDOMNode();
        }
    });

    module.exports = XtabHeader;

})();