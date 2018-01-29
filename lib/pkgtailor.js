#!/usr/bin/env node
/*jslint node: true */
"use strict";

const path = require('path');
const fs = require("fs");
const os = require("os");
const debug = require('debug')('dynatrace');

const cStateNotTailored = "untailored";
const cStateUndefined = "undefined";
const cStateLambdaWithNode4 = "AWS Lambda with Node 4.x";
const cStateLambdaWithNode6 = "AWS Lambda with Node 6.x";
const cStates = [
	cStateNotTailored,
	cStateUndefined,
	cStateLambdaWithNode4,
	cStateLambdaWithNode6
];

const cStateFileName = path.join(__dirname, "pkgtailor-state");

/** 
 * delete all files in folder 'lib' and 'linux-x86-32'
 */
const c32BitPathPattern = /((\/lib)|(\/linux-x86-32))\/[^\/]+$/;

/**
 * @typedef {function} Predicate
 * @param {String} fn the file name
 * @returns {boolean} true if file should be deleted for this environment, false otherwise.
 */

/**
 * @typedef {Object} EnvDef
 * @property {string} environment verbose name
 * @property {string} option command line option name
 * @property {Predicate} deleteFilePredicate
 */

/** 
 * Environment definition for AWS Lambda V4
 * @const {EnvDev} 
 */
const cLambdaV4EnvDef = {
	name: cStateLambdaWithNode4,
	deleteFilePredicate: (fn) => {
		// preserve all *_46.node files except 32 bit binaries
		return /_(4[^6]|[^4][0-9])\.node$/.test(fn) || c32BitPathPattern.test(fn);
	}
};

/** 
 * Environment definition for AWS Lambda V6
 * @const {EnvDev} 
 */
const cLambdaV6EnvDef = {
	name: cStateLambdaWithNode6,
	deleteFilePredicate: (fn) => {
		// preserve all *_48.node files except 32 bit binaries
		return /_(4[^6]|[^4][0-9])\.node$/.test(fn) || c32BitPathPattern.test(fn);
	}
};

/**
 * attempts to read the state file from previous tailoring run
 * @returns {string} tailoring state
 */
function tryReadStateFile() {
	let state = cStateNotTailored;

	try {
		fs.accessSync(cStateFileName, fs.F_OK | fs.R_OK | fs.W_OK);
		try {
			const buf = fs.readFileSync(cStateFileName);
			state = buf.toString();
			debug("read state '" + state + "' from " + cStateFileName);
		} catch (e) {
			throw new Error("failed to read tailoring state from " + cStateFileName);
		}
	} catch(e) {
		throw new Error("state file " + cStateFileName + " is not accessable");
	}
	return state;
}

/**
 * write tailoring state to state file
 * @param {string} state 
 */
function writeStateFile(state) {
	fs.writeFileSync(cStateFileName, state);
}

/**
 * scan given folder recursively and return list of files 
 * @param {string} folderName folder to recursively scan for files
 * @returns {string[]} files found in folder
 */
function scanFolder(folderName) {
	const entries = fs.readdirSync(folderName).map((e) => path.join(folderName, e));

	/** @type {string[]} */
	let files = [];
	entries.forEach((e) => {
		const stat = fs.statSync(e);
		if (stat.isDirectory()) {
			scanFolder(e).forEach(f => files.push(f));
		} else if (stat.isFile()) {
			files.push(e);
		}
	});

	if (os.platform() === "win32") {
		// normalize win32 paths (lower case, replace back slash with forward slash)
		files = files.map(f => f.replace(/\\/g, "/").toLowerCase());
	}
	return files;
}

/**
 * locate the dependency package agent folder
 * will throw error if pacakge cannot be located
 * @returns {string} the absolute path to the folder location
 */
function locateDependencyModule() {
	const innerPath = path.join("oneagent-dependency", "agent");
	const dependencyLocations = [
		path.join(__dirname, "..", "node_modules", "@dynatrace", innerPath),
		path.join(__dirname, "..", "..", innerPath)
	];

	let location;
	dependencyLocations.some(p => {
		try {
			debug("testing dependency module location '" + p + "'");
			
			fs.accessSync(p, fs.F_OK);
			location = p;
			return true;
		} catch (e) {
			return false;
		}
	});

	debug("locateDependencyModule: " + location);
	if (!location) {
		throw new Error("Could not locate 'oneagent-dependency' module");
	}
	return location;
}

/** 
 * execute the tailoring
 */
function tailorModule() {
	if (!options.environment) {
		throw new Error("no environment for tailoring specified.");
	}

	const files = scanFolder(locateDependencyModule());
	const filesToDelete = files.filter(fn => options.environment.deleteFilePredicate(fn));

	console.log("\nTailoring npm module for environment '" + options.environment.name + "'");

	if (options.dryRun) {
		console.log("Dry run - following files will be deleted from npm module");
		filesToDelete.forEach(fn => console.log("  " + fn));
		console.log("");
	}
	else {
		// set undefined state
		writeStateFile(cStateUndefined);
		filesToDelete.forEach(fn => {
			console.log("  deleting file '" + fn + "'");
			fs.unlinkSync(fn);
		});
		writeStateFile(options.environment.name);
	}
}

/**
 * print help and execute process exit
 * @param {number} exitCode the optional exit code (defaults to 1)
 * @returns will never return
 */
function printHelp(exitCode) {
	if (!exitCode) {
		exitCode = 1;
	}
	console.log("Usage: dt-oneagent-tailor [options]");
	console.log("\nvalid options are:");
	cCmdLineOptionsDef.forEach(def => {
		let spacer = new Array(30 - def.name.length).fill(".");
		console.log("  " + def.name + " " + spacer.join("") + " " + def.verbose);
	});

	process.exit(exitCode);
}

/**
 * @typedef {Object} CmdLineDef
 * @prop {string} name the name of the command line option including double dash (--)
 * @prop {string} verbose documentation text for command line option.
 * @prop {function} handler function executed if option is set on command line
 */

 /**
  * @const {CmdLineDef[]}
  */
const cCmdLineOptionsDef = [
	{
		name: "--help",
		verbose: "Print this help",
		handler: () => printHelp(0)
	},
	{
		name: "--dryRun",
		verbose: "print files which to be deleted and exit.",
		handler: () => options.dryRun = true
	},
	{
		name: "--AwsLambdaV4",
		verbose: "tailor environment for AWS Lambda with Node.js V4.x",
		handler: () => {
			debug("setting environment to AWS cLambdaV4EnvDef");
			options.environment = cLambdaV4EnvDef;
		}
	},
	{
		name: "--AwsLambdaV6",
		verbose: "tailor environment for AWS Lambda with Node.js V6.x",
		handler: () => {
			debug("setting environment to AWS cLambdaV6EnvDef");
			options.environment = cLambdaV6EnvDef;
		}
	}
];

/**
 * @typedef {Object} Options
 * @prop {EnvDef} environment
 * @prop {boolean} dryRun
 */

/** 
  * receives comand line option values
  * @const {Options} 
  */
const options = {
	environment: undefined,
	dryRun: false
};

/**
 * parse command line options
 */
function parseOptions() {
	if (process.argv.length < 3) {
		process.argv.push("--help");
	}

	let ok = true;

	// start beyond exe and script name
	for (let i = 2; ok && i < process.argv.length; ++i) {
		const option = process.argv[i];
		debug("processing command line option '" + option + "'");
		ok = cCmdLineOptionsDef.some((def) => {
			if (def.name === option) {
				debug("executing handler for '" + def.name + "'");
				def.handler();
				return true;
			} else {
				return false;
			}
		});
		if (!ok) {
			console.log("unknown command line option '" + option + "'");
			printHelp();
		}
	}
}

/**
 * something is wrong indicator
 * @type {boolean}
 */
let didFail = true;

/** 
 * the tailoring state of desire 
 * @type {string} 
 */
let state;

try {
	console.log("\nTailor Dynatrace Node.js OneAgent npm module for specific runtime environments.\n");

	state = tryReadStateFile();

	if (cStates.indexOf(state) < 0) {
		console.log("ERROR: npm module is in an unknown tailoring state '" + state + "'");
	} else if (state === cStateUndefined) {
		console.log("ERROR: Previous tailoring state left npm module in an undefined state. Please re-install npm module.");
	} else if (state !== cStateNotTailored) {
		console.log("ERROR: The npm module has been already tailored for environment '" + state + "'. Please re-install to tailor for another environment");
	} else {
		parseOptions();
		tailorModule();
		didFail = false;
	}
} catch (e) {
	console.log("\nDarn, something bad happened: " + e.message);
} finally {
	console.log("\nTailoring npm module " + (options.dryRun ? "[DRY RUN] " : "") + (didFail ? "FAILED" : "SUCCEEDED"));
}
