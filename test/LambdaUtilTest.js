const Sinon = require("sinon");
const Assert = require('assert');
const debug = require('debug');
const Path = require('path');
const LambdaUtil = require('../lib/LambdaUtil');

describe("LambdaUtil", () => {

	const debugEnableState = debug.disable();
	let origHandlerDef;
	before(() => {
		// enable debugging to enforce execution of debug code paths
		debug.enable('dynatrace');
		origHandlerDef = process.env._HANDLER;
	});

	after(() => {
		debug.disable();
		debug.enable(debugEnableState);
		process.env._HANDLER = origHandlerDef;
	});

	let sandbox;
	beforeEach(() => {
		sandbox = Sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	function decompose(handlerDef, expectedModuleFilePath, expectedExportPath) {
		it(handlerDef, () => {
			const result = LambdaUtil.decomposeHandlerDef(handlerDef);

			Assert.strictEqual(result.moduleFilePath, expectedModuleFilePath, handlerDef);
			Assert.deepEqual(result.exportPathArray, expectedExportPath);
		});
	}

	describe("decomposeHandlerDef", () => {
		decompose("index.handler", "index", ["handler"]);
		decompose("lib/index.handler", Path.join("lib", "index"), ["handler"]);
		decompose("index.foo.handler", "index", ["foo", "handler"]);
		decompose("lib/index.foo.bar.handler", Path.join("lib", "index"), ["foo", "bar", "handler"]);
	});

	function resolveUserHandler(handlerDef) {
		it(handlerDef, () => {
			// create a proxy object which getter and a getter stub
			const proxyGetterStub = Sinon.stub();
			const proxy = new Proxy(Object.create(null), {
				get: proxyGetterStub
			});

			process.env._HANDLER = "should be preserved";

			// let the proxy object getter return the proxy object
			proxyGetterStub.returns(proxy);

			// decompose handler
			const decomposeResult = LambdaUtil.decomposeHandlerDef(handlerDef);

			// resolveUserHandlerFromDtLambdaHandler destructs exportPath in decomposeResult -> make a copy
			const exportPathCopy = decomposeResult.exportPathArray.slice();

			// stub decomposeHandlerDef and let stub return previous determined result
			const decomposeHandlerDefStub = sandbox.stub(LambdaUtil, "decomposeHandlerDef").returns(decomposeResult);

			const result = LambdaUtil.resolveUserHandlerFromDtLambdaHandler(proxy, handlerDef);

			Sinon.assert.calledOnce(decomposeHandlerDefStub);
			Sinon.assert.calledWith(decomposeHandlerDefStub, handlerDef);

			Assert.strictEqual(proxyGetterStub.callCount, exportPathCopy.length);

			// check if first proxy getter invocation was done with modulePath$topLevelExport
			Sinon.assert.calledWith(proxyGetterStub.getCall(0), proxy, `${decomposeResult.moduleFilePath}$${exportPathCopy[0]}`);

			// check nested export paths
			for (let i = 1; i < exportPathCopy.length; ++i) {
				Sinon.assert.calledWith(proxyGetterStub.getCall(i), proxy, exportPathCopy[i]);
			}

			Assert.strictEqual(result, proxy);
			Assert.strictEqual(process.env._HANDLER, "should be preserved");
		});
	}

	describe("resolveUserHandlerFromDtLambdaHandler", () => {
		resolveUserHandler("index.handler");
		resolveUserHandler("lib/index.handler");
		resolveUserHandler("index.foo.handler");
		resolveUserHandler("lib/index.foo.handler");
		resolveUserHandler("lib/index.foo.bar.handler");
	});
});
