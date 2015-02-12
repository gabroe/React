(function () {

    var React = require('react'),
        DossierItem = require('./DossierItem');

    /**
     * Dossier List to display a list of dossier items.
     *
     * @class
     */
    var DossierList = React.createClass({displayName: "DossierList",
        render: function render() {
            var dossierItemNodes = this.props.data.map(function (dossierItem) {
                return (
                    React.createElement(DossierItem, {item: dossierItem, name: dossierItem.name}, 
                        dossierItem.name
                    )
                );
            });

            return (
                React.createElement("div", {className: "mstr-all-dossier-list clearfix"}, 
                    dossierItemNodes
                )
            );
        }
    });

    module.exports = DossierList;

})();