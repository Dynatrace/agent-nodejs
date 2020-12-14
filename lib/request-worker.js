'use strict';

const { URL } = require('url');
const request = require('then-request');
const debug = require('debug')('dynatrace');

let reqData = '';

function writeResult(result) {
    process.stdout.write(JSON.stringify(result), function onWritten() {
        process.exit(0);
    });
}

function isSecurityEnhancedDomain(url) {
    const hostname = new URL(url).hostname;
    return (hostname.includes('.dynatrace.com')) ||
        (hostname.includes('.dynatracelabs.com')) ||
        (hostname.includes('.ruxit.com')) ||
        (hostname.includes('.ruxitlabs.com'));
}

function doRequest() {
    debug(`child request, cmd size: ${reqData.length} bytes`);
    const req = JSON.parse(reqData);

    if (!isSecurityEnhancedDomain(req.url)) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    request(req.method, req.url, req.options)
        .done(function onReqDone(res) {
            try {
                res.body = res.getBody('utf8');
                debug(`child request done, body size: ${res.body != null ? res.body.length : '-'} bytes`);
            } catch (e) {
                debug(`child request got no body: ${e.stack}`);
                res.body = '';
            }
            writeResult({ success: true, response: res });
        }, function onReqErr(err) {
            debug(`child request failed: ${err.message}`);
            writeResult({ success: false, error: err.message });
        });
}

process.stdin.on('data', function onData(chunk) {
    reqData += chunk;
}).on('end', doRequest);
