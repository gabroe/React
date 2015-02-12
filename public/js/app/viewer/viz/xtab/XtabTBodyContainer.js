(function () {

    var $ = require('jquery'),
        React = require('react'),
        XtabTBody = require('./XtabTBody');

    /**
     * Xtab Table Body container view.
     *
     * @class
     */
    var XtabTBodyContainer = React.createClass({displayName: "XtabTBodyContainer",
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
                        React.createElement("col", null)
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
                    React.createElement(XtabTBody, {isEmpty: loadedChunks.indexOf(i) < 0, key: i, rowHeight: rowHeight, rowItems: rowItems.slice(i * PAGE_SIZE, ((i + 1) * PAGE_SIZE))})
                );
            }

            return (
                React.createElement("div", {className: "mstr-xtab-container", style: {height: containerHeight}}, 
                    React.createElement("table", {className: "table mstr-xtab body", ref: "bodyTableNode"}, 
                        React.createElement("colgroup", null, 
                            colNodes
                        ), 
                        tBodies
                    )
                )
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

    module.exports = XtabTBodyContainer;
})();