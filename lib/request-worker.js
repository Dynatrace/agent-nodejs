'use strict';

var request = require('then-request');

var reqData = '';

function sendResult(result) {
    process.stdout.write(JSON.stringify(result), function onWritten() {
        process.exit(0);
    });
}

function doRequest() {
    var req = JSON.parse(reqData);

    request(req.method, req.url, req.options)
        .done(function onReqDone(res) {
            try {
                res.body = res.getBody("utf8");
            } catch (e) {
                res.body = "";
            }
            sendResult({ success: true, response: res });
        }, function onReqErr(err) {
            sendResult({ success: false, error: err.message });
        });
}

process.stdin.on('data', function onData(chunk) {
    reqData += chunk;
}).on('end', doRequest);
