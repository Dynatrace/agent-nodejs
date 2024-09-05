'use strict';

const { URL } = require('url');
const https = require('https');
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

	https.request(req.url, req.options, (res) => {
		const response = {
			statusCode: res.statusCode,
			headers: res.headers,
			url: req.url,
			body: ""
		}

		res.on("data", (chunk) => {
			response.body += `${chunk}`;
		});

		res.on("end", () => {
			debug(`child request done, body size: ${response.body.length} bytes`);
			writeResult({ success: true, response: response });
		});

	}).on("error", (e) => {
		debug(`child request failed: ${e.message}`);
		writeResult({ success: false, error: e.message });
	}).end();
}

process.stdin.on('data', function onData(chunk) {
	reqData += `${chunk}`;
}).on('end', doRequest);
