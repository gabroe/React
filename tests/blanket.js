/**
 * Created by xiazhang on 2/9/15.
 */
var path = require('path');
var srcDir = path.join(__dirname, '..', 'routes');

require('blanket')({
    // Only files that match the pattern will be instrumented
    pattern: srcDir
});