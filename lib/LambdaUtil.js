'use strict';

/**
 * @dynatrace/serverless-oneagent checks if this file exists to determine, if DT_LAMBDA_HANDLER is supported.
 * Thus, do not rename or delete this file
 */

const path = require('path');
const debug = require('debug')('dynatrace');


/**
 * transform handler received from DT_LAMBDA_HANDLER to module$export form
 * encode Lambda style handler definition lib/index.foo.bar.myHandler to OneAgent proxy
 * style lib/index$foo.bar.myHandler
 *
 * @param {string} handlerDef
 */
function decomposeHandlerDef(handlerDef) {
    // decompose handler to module path, module file name and handler export

    // lib/index.foo.bar.myHandler -> index.foo.bar.myHandler and lib/
    const fileHandlerPart = path.basename(handlerDef);
    const modulePath = handlerDef.substr(0, handlerDef.length - fileHandlerPart.length);

    const splitted = fileHandlerPart.split('.');
    debug(`splitted=${splitted}`);

    const result = {
        moduleFilePath: path.join(modulePath, splitted.shift()),
        exportPathArray: splitted
    };

    debug(`fileHandlerPart=${fileHandlerPart}, modulePath=${modulePath}, result.moduleFilePath=${result.moduleFilePath}, result.exportPath=${result.exportPathArray}`);

    return result;
}


/**
 * resolve user handler with given agent proxy object and handler definition
 * @param agentProxyObj proxy object returned by agent initialize
 * @param dtLambdaHandler value of DT_LAMBDA_HANDLER
 * @returns wrapped user handler function
 *
 * mimics old style call proxy object access sequence
 * 1. request modulePath$topLevelExport from agent proxy object -> agent will return nested export object with wrapped user handler
 * 2. resolve handler in nested export object (optional)
 *
 * Example DT_LAMBDA_HANDLER=index.handler
 * 1. request "index$handler" from agentProxyObj (agent returns export wrapped user handler)
 * 2. nothing more to do (handler was top level property of the export object)
 *
 * Example DT_LAMBDA_HANDLER=lib/index.foo.bar.handler
 * 1. request "lib/index$foo" from agentProxyObj (agent returns export { bar: { handler: wrappedUserHandler }})
 * 2. from export object returned by agent, get handler with property path "bar.handler"
 */
function resolveUserHandlerFromDtLambdaHandler(agentProxyObj, dtLambdaHandler) {
    // OneAgent uses _HANDLER to decode the handler string - set temporarily to encoded handler string
    const envHandlerOrig = process.env._HANDLER;
    try {
        // trigger user handler loading through proxy with transformed handler definition
        let { moduleFilePath, exportPathArray } = exports.decomposeHandlerDef(dtLambdaHandler);

        const encodedHandler = `${moduleFilePath}$${exportPathArray.join('.')}`;

        debug(`setting _HANDLER=${encodedHandler} (${envHandlerOrig})`);

        process.env._HANDLER = encodedHandler;

        // get top level export from user module
        debug(`accessing ${moduleFilePath}$${exportPathArray[0]} in proxy object`);

        // trigger agent proxy object to require and wrap user handler
        let handler = agentProxyObj[`${moduleFilePath}$${exportPathArray[0]}`];

        exportPathArray.shift();
        while (exportPathArray.length > 0 && handler != null) {
            const key = exportPathArray.shift();
            debug(`resolving ${key}`);
            handler = handler[key];
        }

        return handler;

    } finally {
        // restore _HANDLER to original value
        process.env._HANDLER = envHandlerOrig;
        debug(`restoring _HANDLER=${envHandlerOrig}`);
    }
}

exports.decomposeHandlerDef = decomposeHandlerDef;
exports.resolveUserHandlerFromDtLambdaHandler = resolveUserHandlerFromDtLambdaHandler;
