(function () {
    var React = require('react');
    /**
     * Xtab table row component.
     *
     * @class
     */
    var XtabTRow = React.createClass({
        render: function render() {
            var tdNodes = this.props.rowData.map(function (rowValue) {
                return (
                    <td>{rowValue}</td>
                );
            });

            return (
                <tr>
                    {tdNodes}
                </tr>
            );
        }
    });

    module.exports = XtabTRow;

})();