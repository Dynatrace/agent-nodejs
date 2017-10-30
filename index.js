'use strict';

var debug = require('debug')('dynatrace');
var nodeagent = require('@dynatrace/oneagent-dependency');
var request = require('./lib/request');

var defaultServer = '.live.dynatrace.com';

function _tenant(options) {
    return options.environmentid || options.tenant;
}

function _api_base_url(options) {
    if (options.apiurl) {
        debug('Using provided API url', options.apiurl);
        return options.apiurl;
    }
    var base_url = options.endpoint || options.server || 'https://' + _tenant(options) + defaultServer;
    return base_url.replace('/communication', '').replace(':8443', '').replace(':443', '') + '/api';
}

function _credentials(options) {
    if (!options.environmentid || !options.apitoken) {
        debug('No API token found - using legacy authentication');
        return options;
    }

    var uri = _api_base_url(options) + '/v1/deployment/installer/agent/connectioninfo?Api-Token=' + options.apitoken;

    debug('Trying to discover credentials from ', uri);
    var res = request('GET', uri, { timeout: 5000, socketTimeout: 5000 });
    if (res.statusCode < 200 || res.statusCode >= 300 || !res.body) {
        debug('Failed fetching credentials from ', uri, ' statusCode: ', res.statusCode);
        throw new Error('Failed fetching credentials from ' + uri);
    }

    debug('Got credentials from ', uri);
    var credentials = JSON.parse(res.body);
    if (!credentials) {
        throw new Error('Error fetching tenant token from ' + uri);
    }

    return credentials;
}

function _server(options) {
    return options.endpoint || options.server || 'https://' + _tenant(options) + defaultServer;
}

function _agentOptions(options) {
    var credentials = _credentials(options);

    return {
        server: credentials.communicationEndpoints ? credentials.communicationEndpoints.join(';') : _server(options),
        tenant: _tenant(options),
        tenanttoken: credentials.tenantToken ||  credentials.tenanttoken, //tenantToken comes from api, tenanttoken from cf-service
        loglevelcon: 'none'
    };
}

function _cfParseVcap(vcapServices) {
    var rgx = /dynatrace|ruxit/;

    var serviceProperties = Object.keys(vcapServices);

    for (var i = 0; i < serviceProperties.length; i++) {
        var key = serviceProperties[i];

        if (key.search(rgx) !== -1 && vcapServices[key][0]) {
            return vcapServices[key][0].credentials;
        } else {
            for (var j = 0; j < vcapServices[key].length; j++) {
                var userService = vcapServices[key][j];
                if (userService.name && userService.name.search(rgx) !== -1 ) {
                    return userService.credentials;
                }

                if (userService.label && userService.label.search(rgx) !== -1) {
                    return userService.credentials;
                }

                if (userService.tags) {
                    for (var k = 0; k < userService.tags.length; k++) {
                        if (userService.tags[k].search(rgx) !== -1) {
                            return userService.credentials;
                        }
                    }
                }
            }
        }
    }
}

function handleCloudFoundry(vcapServices, vcapApplication) {
    debug('Cloud foundry environment detected.');
    process.env.RUXIT_APPLICATIONID = vcapApplication.application_name;
    process.env.RUXIT_HOST_ID = vcapApplication.application_name + '_' + process.env.CF_INSTANCE_INDEX;
    process.env.RUXIT_IGNOREDYNAMICPORT = true;
    var credentials = _cfParseVcap(vcapServices);
    if (!credentials) {
        throw new Error('No credentials found in VCAP_SERVICES');
    }

    return nodeagent(_agentOptions(credentials));
}

function handleHeroku(options) {
    debug('Heroku environment detected.');

    // Dyno metadata is a labs feature and can be enabled via  
    // $ heroku labs:enable runtime-dyno-metadata -a <app name>
    // s. https://devcenter.heroku.com/articles/dyno-metadata

    // Process group
    // process.env.RUXIT_CLUSTER_ID = process.env.DYNO;

    if (process.env.HEROKU_APP_NAME) {
        process.env.RUXIT_CLUSTER_ID = process.env.HEROKU_APP_NAME;
        process.env.RUXIT_APPLICATIONID = process.env.HEROKU_APP_NAME;
    }

    process.env.DT_VOLATILEPROCESSGROUP = true;
    process.env.RUXIT_IGNOREDYNAMICPORT = true;
 
    return nodeagent(_agentOptions(options));
}

function handleAwsLambda() {
    if (!process.env.DT_NODE_OPTIONS) {
        debug('DT_NODE_OPTIONS not set.');
    }

    debug('initializing agent for habitat AWS.Lambda');
    var createAgentResult = nodeagent({}, { habitat: 'AWS.Lambda' });
    if (createAgentResult && (createAgentResult.createAwsLambdaExportsInterceptor instanceof Function)) {
        debug('creating interceptor object');
        createAgentResult = createAgentResult.createAwsLambdaExportsInterceptor();
    } else {
        debug('agent does not support interceptor object');
        throw new Error('agent does not support interceptor object');
    }
    return createAgentResult;
}

function isAwsLambda() {
    /*
     * check if Lambda and module has been required directly by lambda index.js (semi-automtic injection)
     */
    if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return false;
    }

    debug('habitat is AWS Lambda');
    var requiredByLambda = module.parent && module.parent.filename && module.parent.filename.indexOf('awslambda/index.js') >= 0;
    if (!requiredByLambda) {
        debug('agent has not been required from AWS Lambda directly' + (module.parent && module.parent.filename) ? module.parent.filename : 'unknown');
    }

    return requiredByLambda;
}

function agentLoader(options) {
    if (!options) {
        if (process.env.VCAP_SERVICES && process.env.VCAP_APPLICATION) {
            var vcapObject = null;
            var vcapApplication = null;
            try {
                vcapObject = JSON.parse(process.env.VCAP_SERVICES);
            } catch (err) {
                vcapObject = process.env.VCAP_SERVICES;
            }

            try {
                vcapApplication = JSON.parse(process.env.VCAP_APPLICATION);
            } catch (err) {
                vcapApplication = process.env.VCAP_APPLICATION;
            }

            return handleCloudFoundry(vcapObject, vcapApplication);
        } else {
            throw new Error('Error parsing credentials');
        }
    } else if (process.env.DYNO) {
        return handleHeroku(options);
    }

    debug('Using passed in options');
    return nodeagent(_agentOptions(options));
}

if (!isAwsLambda()) {
    module.exports = agentLoader;
} else {
    // export interceptor object
    module.exports = handleAwsLambda();
}
