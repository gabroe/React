(function () {
    var React = require('react');
    /**
     * Xtab table row component.
     *
     * @class
     */
    var XtabTRow = React.createClass({displayName: "XtabTRow",
        render: function render() {
            var tdNodes = this.props.rowData.map(function (rowValue) {
                return (
                    React.createElement("td", null, rowValue)
                );
            });

            return (
                React.createElement("tr", null, 
                    tdNodes
                )
            );
        }
    });

    module.exports = XtabTRow;

})();