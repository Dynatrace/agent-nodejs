'use strict';

const cp = require('child_process');
const path = require('path');
const debug = require('debug')('dynatrace');

function request(method, url, options, rejectUnauthorized) {
	const req = JSON.stringify({
		method: method,
		url: url,
		options: options,
		rejectUnauthorized: rejectUnauthorized
	});

	const workerPath = require.resolve('./request-worker.js');
	const opts = {
		cwd: path.dirname(workerPath),
		input: req + '\r\n',
		stdio: [null, null, process.stderr],
		timeout: 20000,
		windowsHide: true
	};
	// never let credentials reach the debug log
	const { apitoken, headers, ...loggableOptions } = options || {};
	if (headers != null) {
		loggableOptions.headers = Object.assign({}, headers);
		if (loggableOptions.headers.Authorization != null) {
			loggableOptions.headers.Authorization = '<redacted>';
		}
	}
	debug('spawning', process.execPath, workerPath, loggableOptions);

	const res = cp.spawnSync(process.execPath, [workerPath], opts);
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
