'use strict';

(function () {

    var timeout,
        cache = {},
        xhr;

    function getPages(dataURL, startPage, token) {

        var pages = {rows: []},
            page = startPage,
            getPage = function () {

                var data,
                    windowInfo;

                xhr.open("GET", dataURL + "/" + (page++) + "?token=" + token);
                xhr.send();

                xhr.onreadystatechange = function () {

                    if (xhr.readyState == 4 && xhr.status == 200) {

                        if (xhr.response) {
                            data = JSON.parse(xhr.response);

                            if (data) {

                                pages.rows = pages.rows.concat(data.rows);

                                windowInfo = data.window;

                                if (windowInfo.cp < windowInfo.tpc - 1) {

                                    timeout = setTimeout(getPage, 0);

                                } else {
                                    cache[dataURL] = pages;
                                    postMessage(pages);

                                }
                            }
                        }
                    }
                }

            };

        if (timeout) {

            clearTimeout(timeout);
        }

        if (cache[dataURL]) {
            postMessage(cache[dataURL]);
            return;
        }

        xhr = xhr || new XMLHttpRequest();
        getPage();
    }

    addEventListener('message', function (e) {

        var data = e.data;

        getPages(data.dataURL, data.startPage, data.token);
    });
})();
