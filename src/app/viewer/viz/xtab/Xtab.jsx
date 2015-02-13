(function () {

    var $ = require('jquery'),
        React = require('react'),
        XtabHeader = require('./XtabHeader'),
        XtabTBodyContainer = require('./XtabTBodyContainer');

    function onScrollIFHandler() {
        var loadedChunks = this.loadedChunks,
            prevLoadedChunks = loadedChunks.concat(),
            model = this.props.model,
            PAGE_SIZE = model.PAGE_SIZE,
            processLoadedCunks = true,
            xtabScrollNode = this.getDOMNode(),
            fullData = model.fullData,
            fullDataWindow = fullData.window,
            totalRowCount = fullDataWindow.trc,
            position = ($(".mstr-xtab-scrollable", xtabScrollNode).scrollTop() * totalRowCount ) / (($(".mstr-xtab-container", xtabScrollNode).height()) * PAGE_SIZE),
            currentChunk = parseInt(position, 10),
            i;

        // Have we already rendered the previous and next page?
        if (Math.max.apply(Math, loadedChunks) > currentChunk && Math.min.apply(Math, loadedChunks) <= currentChunk) {
            // Skip processing pages.
            processLoadedCunks = false;
        }

        // Have we reached the end ? No more chunks to render.
        if (currentChunk > Math.ceil(totalRowCount / PAGE_SIZE) - 1) {
            processLoadedCunks = false;
        }

        // Do we need to process the loaded chunks ?
        if (processLoadedCunks) {
            var xtabTableBody = $("table.mstr-xtab.body", xtabScrollNode),
                originalTBodiesCollection = xtabTableBody.get(0).tBodies,
                tBodiesCollection = [].slice.call(originalTBodiesCollection).map(function (tbody, index) {
                    return index;
                }),
                pages = Math.ceil(totalRowCount / PAGE_SIZE),
                newPages = false;

            //check whether the need append new chunks bellow, assume this is the next one is missing.
            if (loadedChunks.indexOf(currentChunk - 1) < 0 || loadedChunks.indexOf(currentChunk + 1) < 0) {
                // Loop through all extra chunks and clear the ones we no longer need
                while (tBodiesCollection.length > currentChunk + 2) {
                    ////remove it from DOM
                    tBodiesCollection = tBodiesCollection.slice(0, -1);

                    // Remove from the chunk index array
                    loadedChunks = loadedChunks.slice(0, -1);
                }

                //loop through all loaded chunks and clear the ones we no longer need
                loadedChunks.forEach(function (chunkId) {
                    if (chunkId < currentChunk - 1) {
                        //remove from the chunk index array
                        loadedChunks = loadedChunks.slice(1);
                    }
                }, this);

                //append new chunks
                for (i = currentChunk - 1; i <= Math.min(currentChunk + 1, pages - 1); i++) {

                    //if chunk is missing
                    if (loadedChunks.indexOf(i) < 0) {

                        if (tBodiesCollection.length <= i) {
                            newPages = true;

                            //add to index array
                            loadedChunks.push(i);

                        } else {

                            if (i >= 0) {
                                //add to index array
                                loadedChunks.splice(i - currentChunk + 1, 0, i);
                            }
                        }

                    }
                }

                // Since we've changed the chunks, refresh the view.
                this.setState({
                    pageData: fullData,
                    incRender: true
                });

                this.loadedChunks = loadedChunks;
            }
        }

        // Set the left if the user scrolls left.
        $(this.refs.headerTable.getHeaderTableNode()).css("left", -this.refs.containerScrollNode.getDOMNode().scrollLeft);
    }

    function alignHeaders(xtabDomNode, setAsFixed) {

        var xtabTableBody = $("table.mstr-xtab.body", xtabDomNode),
            lockedHeadersTable = $("table.mstr-xtab.header", xtabDomNode),
            tableHeaders = $("tbody:first-of-type tr:first-child td", xtabTableBody),
            tableCols = $("col", xtabTableBody),
            lockedCols = $("col", lockedHeadersTable),
            width,
            totalwidth = 0;

        tableHeaders.each(function (index, element) {
            width = element.clientWidth;

            $(tableCols.get(index)).width(width);
            $(lockedCols.get(index)).width(width);

            totalwidth += width;
        });

        lockedHeadersTable.width(totalwidth);
        lockedHeadersTable.css("max-width", totalwidth);

        if (setAsFixed) {

            xtabTableBody.css("table-layout", setAsFixed ? "fixed" : "auto");
        }
    }

    /**
     * The root xtab component.
     *
     * @class
     */
    var Xtab = React.createClass({
        /**
         * An array of indices specifying the chunks in the Xtab that are loaded with rows. The rest of the tbodies,
         * if rendered, will be rendered empty.
         *
         */
        loadedChunks: [0, 1],

        getInitialState: function getInitialState() {
            return this.props;
        },

        render: function render() {
            var state = this.state,
                pageData = state.pageData;

            return (
                <div className="small">
                    <div className="mstr-xtab-scrollable" onScroll={onScrollIFHandler.bind(this)} ref="containerScrollNode">
                        <XtabTBodyContainer model={state.model} pageData={pageData} rowItems={pageData.rows} loadedChunks={this.loadedChunks}/>
                    </div>
                    <XtabHeader model={state.model} headerItems={pageData.header}  ref="headerTable"/>
                </div>
            );
        },

        componentDidMount: function componentDidMount() {
            var model = this.props.model;

            // Align headers.
            alignHeaders(this.getDOMNode(), true);

            // Set up an event listener on the model to refresh view.
            model.on('updateView', function (data) {
                // Set the new state on the view.
                this.setState({
                    pageData: data
                });
            }.bind(this));

            // Set up an event listener on the model to refresh view.
            model.on('postFetchPages', function (data) {
                // Silently update the page data.
                this.state.pageData = data;

                // Run the on scroll inc fetch handler so as to check if we need to render more pages.
                onScrollIFHandler.call(this);
            }.bind(this));

            // Fetch the rest of the pages in a webworker.
            window.setTimeout(model.fetchPages.bind(model), 0);
        }
    });

    module.exports = Xtab;
})
();