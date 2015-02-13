(function () {
    /**
     * A popup that wraps another component inside
     *
     * @class
     */
    mstrX.ui.Popup = React.createClass({
        render: function render() {
            var hostedComponent = this.props.hostedCompoment;
            return (
                <div className="mstr-common-popup">
                    hostedComponent
                </div>
            );
        }
    });
})();