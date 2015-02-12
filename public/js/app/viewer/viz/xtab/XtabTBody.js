(function () {
    var React = require('react'),
        XtabTRow = require('./XtabRow');

    /**
     * Xtab tbody component. Depending on whether the tbody is marked as empty or not, it displays
     * the rows for each of it's row items.
     *
     * @class
     */
    var XtabTBody = React.createClass({displayName: "XtabTBody",
        render: function render() {
            var rowItems = this.props.rowItems,
                rowNodes = [];

            // Are we rendering a non-empty tbody ?
            if (!this.props.isEmpty) {
                // Map each of the row-items to a XtabTRow component.
                rowNodes = rowItems.map(function (rowValue) {
                    return (
                        React.createElement(XtabTRow, {rowData: rowValue})
                    );
                });
            } else {
                // Else push an empty tbody with a single row and the approx height.
                rowNodes.push(
                    React.createElement("tr", {style: {height: (rowItems.length * this.props.rowHeight) + 'px'}}, 
                        React.createElement("td", {colSpan: rowItems[0].length}
                        )
                    )
                );
            }

            return (
                React.createElement("tbody", null, 
                    rowNodes
                )
            );
        },

        shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
            // If the props didn't change - don't update the component.
            // TODO: NS - this needs to be more solid.
            return this.props.isEmpty !== nextProps.isEmpty ||
                (!nextProps.isEmpty && nextProps.rowItems[0][0] !== this.props.rowItems[0][0]);
        }
    });

    module.exports = XtabTBody;
})();