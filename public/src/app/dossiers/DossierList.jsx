(function () {
    /**
     * Dossier List to display a list of dossier items.
     *
     * @class
     */
    mstrX.app.dossiers.DossierList = React.createClass({
        render: function render() {
            var dossierItemNodes = this.props.data.map(function (dossierItem) {
                return (
                    <mstrX.app.dossiers.DossierItem item={dossierItem} name={dossierItem.name}>
                        {dossierItem.name}
                    </mstrX.app.dossiers.DossierItem>
                );
            });

            return (
                <div className="mstr-all-dossier-list clearfix">
                    {dossierItemNodes}
                </div>
            );
        }
    });
})();