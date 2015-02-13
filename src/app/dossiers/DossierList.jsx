(function () {

    var React = require('react'),
        DossierItem = require('./DossierItem');

    /**
     * Dossier List to display a list of dossier items.
     *
     * @class
     */
    var DossierList = React.createClass({
        render: function render() {
            var dossierItemNodes = this.props.data.map(function (dossierItem) {
                return (
                    <DossierItem item={dossierItem} name={dossierItem.name}>
                        {dossierItem.name}
                    </DossierItem>
                );
            });

            return (
                <div className="mstr-all-dossier-list clearfix">
                    {dossierItemNodes}
                </div>
            );
        }
    });

    module.exports = DossierList;

})();