'use strict';

var cp = require('child_process');
var path = require('path');

function request(method, url, options) {
    var req = JSON.stringify({
        method: method,
        url: url,
        options: options
    });

    var workerPath = require.resolve('./request-worker.js');
    var opts = {
        cwd: path.dirname(workerPath),
        input: req + '\r\n',
        timeout: 20000,
        windowsHide: true
    };
    var res = cp.spawnSync(process.execPath, [ workerPath ], opts);
    if (res.status !== 0) {
        throw new Error(res.stderr.toString());
    }
    if (res.error) {
        throw res.error;
    }
    var result = JSON.parse(res.stdout);
    if (!result.success) {
        throw new Error(result.error.message || result.error || result);
    }
    return {
        statusCode: result.response.statusCode,
        body: result.response.body
    };
}

module.exports = request;
