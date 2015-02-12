(function () {

    var React = require('react');

    /**
     * A mixin to navigate to a given page within a dossier.
     *
     * @mixin
     */
    var DossierItemMixin = {
        goToPage: function goToPage(dossierName, index) {
            window.open("/dossier/" + dossierName + '#/' + index, "_self");
        }
    };

    /**
     * A Dossier Item being displayed on the All Dossier Viewer page.
     *
     * @class
     * @mixes mstrX.app.dossiers.DossierItemMixin
     */
    var DossierItem = React.createClass({displayName: "DossierItem",

        mixins: [DossierItemMixin],

        getDefaultProps: function getDefaultProps() {
            return {
                lastUpdated: 'Last Updated: 2 days ago'
            };
        },

        handleClick: function handleClick(evt) {
            this.goToPage(this.props.item.name, evt.target.getAttribute("data-idx") || 0);
        },

        render: function render() {
            var props = this.props,
                dossierItem = props.item;

            var dossierPageNodes = (dossierItem.pages || []).map(function (dossierPage, index) {
                return (
                    React.createElement("span", {title: "Navigate to page: " + dossierPage.name, className: "item-page", "data-idx": index}
                    )
                );
            }, this);

            return (
                React.createElement("div", {className: "mstr-dossier-item", onClick: this.handleClick.bind(this)}, 
                    React.createElement("div", {className: "item-icn"}), 
                    React.createElement("div", {className: "item-name"}, dossierItem.name), 
                    React.createElement("div", {className: "item-upd"}, props.lastUpdated), 
                    React.createElement("div", {className: "item-pages"}, dossierPageNodes)
                )
            );
        }
    });

    module.exports = DossierItem;
})();