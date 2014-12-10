'use strict';

(function () {
    var request = new XMLHttpRequest(),
        page = 1,
        data,
        windowInfo,
        source,
        timeout,
        chunks = {rows: []},

        timer,

        getChunk = function () {

            request.open("GET", source + "/" + (page++));
            request.send();

            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    if (request.response) {
                        data = JSON.parse(request.response);

                        if (data) {

                            //postMessage(data);

                            chunks.rows = chunks.rows.concat(data.rows);
                            console.log("worker: chunk " + page + " received.");

                            windowInfo = data.window;

                            if (windowInfo.cp < windowInfo.tpc - 1) {
                                timeout = setTimeout(getChunk, 0);
                            } else {
                                //console.log("Done in - " + (new Date() - timer));
                                postMessage(chunks);
                                //console.log("Done copying in - " + (new Date() - timer));
                            }
                        }
                    }
                }
            }
        };

    addEventListener('message', function (e) {

        timer = new Date();
        source = e.data.source;
        page = e.data.page;
        if (timeout) {
            clearTimeout(timeout);
        }
        chunks = {rows: []};
        getChunk();
    });
})();
