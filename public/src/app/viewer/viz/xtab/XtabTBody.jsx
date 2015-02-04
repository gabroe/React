(function () {
    /**
     * Xtab tbody component. Depending on whether the tbody is marked as empty or not, it displays
     * the rows for each of it's row items.
     *
     * @class
     */
    mstrX.app.viewer.viz.xtab.XtabTBody = React.createClass({
        render: function render() {
            var rowItems = this.props.rowItems,
                rowNodes = [];

            // Are we rendering a non-empty tbody ?
            if (!this.props.isEmpty) {
                // Map each of the row-items to a XtabTRow component.
                rowNodes = rowItems.map(function (rowValue) {
                    return (
                        <mstrX.app.viewer.viz.xtab.XtabTRow rowData={rowValue} />
                    );
                });
            } else {
                // Else push an empty tbody with a single row and the approx height.
                rowNodes.push(
                    <tr style={{height: (rowItems.length * this.props.rowHeight) + 'px'}}>
                        <td colSpan={rowItems[0].length}>
                        </td>
                    </tr>
                );
            }

            return (
                <tbody>
                    {rowNodes}
                </tbody>
            );
        },

        shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
            // If the props didn't change - don't update the component.
            // TODO: NS - this needs to be more solid.
            return this.props.isEmpty !== nextProps.isEmpty ||
                (!nextProps.isEmpty && nextProps.rowItems[0][0] !== this.props.rowItems[0][0]);
        }
    });
})();