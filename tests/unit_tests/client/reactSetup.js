/**
 * Created by xiazhang on 2/10/15.
 */
var jsdom = require('jsdom');

// A super simple DOM ready for React to render into
// Store this DOM and the window in global scope ready for React to access
global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.window = document.parentWindow;
global.Worker = require('webworker-threads').Worker;
global.navigator = {
    userAgent: 'node.js'
};

var reactPath = '../../../public/js/';

var requireReact = function(reactClass) {
    return require(reactPath + reactClass);
};

module.exports  = requireReact;
