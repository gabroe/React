(function () {
    /**
     * Xtab Table Body container view.
     *
     * @class
     */
    mstrX.app.viewer.viz.xtab.XtabTBodyContainer = React.createClass({
        /**
         * The average row height of the rows in a given table.
         *
         * @default 34
         */
        rowHeight: -1,

        render: function render() {
            var props = this.props,
                rowItems = props.rowItems,
                colNodes = props.rowItems[0].map(function () {
                    return (
                        <col></col>
                    );
                }),
                PAGE_SIZE = props.model.PAGE_SIZE,
                loadedChunks = props.loadedChunks,
                maxTBodies = Math.max.apply(Math, loadedChunks),
                rowHeight = this.rowHeight,
                containerHeight = rowHeight === -1 ? 'auto' : ((props.pageData.window.trc * rowHeight) + 'px'),
                tBodies = [],
                i;

            for (i = 0; i <= maxTBodies; i++) {
                tBodies.push(
                    <mstrX.app.viewer.viz.xtab.XtabTBody isEmpty={loadedChunks.indexOf(i) < 0} key={i} rowHeight={rowHeight} rowItems={rowItems.slice(i * PAGE_SIZE, ((i + 1) * PAGE_SIZE))}/>
                );
            }

            return (
                <div className="mstr-xtab-container" style={{height: containerHeight}}>
                    <table className="table mstr-xtab body" ref="bodyTableNode">
                        <colgroup>
                            {colNodes}
                        </colgroup>
                        {tBodies}
                    </table>
                </div>
            );
        },

        componentDidMount: function componentDidMount() {
            var rowHeight = this.rowHeight;

            // Have we cached the row height yet?
            if (rowHeight === -1) {
                // If we haven't - measure the first row ...
                var tableRow = $("tr", this.refs.bodyTableNode.getDOMNode()).get(0);

                // ... and cache the row height.
                this.rowHeight = $(tableRow).height();

                // Set the height of the rows on the dom node.
                $(this.getDOMNode()).css('height', (this.props.pageData.window.trc * rowHeight) + 'px');
            }
        }
    });
})();