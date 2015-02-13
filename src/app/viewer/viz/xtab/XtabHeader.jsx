(function () {
    var React = require('react'),
        $FMT_MGR = require('../../../../util/formatManager');

    /**
     * Xtab Header Class.
     *
     * @class
     */
    var XtabHeader = React.createClass({
        render: function render() {
            var headerItems = this.props.headerItems,
                headerNodes = headerItems.map(function (headerName, idx) {
                    return (
                        <th data-idx={idx}>{headerName}</th>
                    );
                }),
                colNodes = headerItems.map(function () {
                    return (
                        <col></col>
                    );
                }),
                tableHeaderStyle = $FMT_MGR.getStyle(this.props.model.get('data'), 'columnheader');

            return (
                <div className="mstr-xtab-header-container" onClick={this.handleClick.bind(this)}>
                    <table className="table mstr-xtab header" style={tableHeaderStyle} ref="headerTableNode">
                        <colgroup>
                            {colNodes}
                        </colgroup>
                        <thead>
                            <tr>
                                {headerNodes}
                            </tr>
                        </thead>
                    </table>
                </div>
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