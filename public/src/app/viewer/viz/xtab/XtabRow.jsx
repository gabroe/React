(function () {
    /**
     * Xtab table row component.
     *
     * @class
     */
    mstrX.app.viewer.viz.xtab.XtabTRow = React.createClass({
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

})();