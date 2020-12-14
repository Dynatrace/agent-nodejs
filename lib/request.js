'use strict';

const cp = require('child_process');
const path = require('path');
const debug = require('debug')('dynatrace');

function request(method, url, options) {
    const req = JSON.stringify({
        method: method,
        url: url,
        options: options
    });

    const workerPath = require.resolve('./request-worker.js');
    const opts = {
        cwd: path.dirname(workerPath),
        input: req + '\r\n',
        stdio: [ null, null, process.stderr ],
        timeout: 20000,
        windowsHide: true
    };
    debug('spawning', process.execPath, workerPath, options);
    const res = cp.spawnSync(process.execPath, [ workerPath ], opts);
    if (res.status !== 0) {
        debug(`child process failed with status: ${res.status}`);
        throw new Error(`Failed to request credentials ${res.status}`);
    }
    if (res.error) {
        debug(`child process failed with error: ${res.error}`);
        throw res.error;
    }
    debug(`parsing credentials: got ${res.stdout != null ? res.stdout.length : '-'} bytes`);
    const result = JSON.parse(res.stdout);
    if (!result.success) {
        debug('failed to parse result');
        throw new Error(result.error.message || result.error || result);
    }
    return {
        statusCode: result.response.statusCode,
        body: result.response.body
    };
}

module.exports = request;
