'use strict';

var debug = require('debug')('dynatrace');
var nodeagent = require('@dynatrace/oneagent-dependency');
var request = require('./lib/request');

var defaultServer = '.live.dynatrace.com';

function _consoleLogLevel() {
    return debug.enabled ? 'info' : 'none';
}

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

    var baseUrl = _api_base_url(options) + '/v1/deployment/installer/agent/connectioninfo';
    debug('Trying to discover credentials from:', baseUrl);

    var res = request('GET', baseUrl + "?Api-Token=" + options.apitoken, { timeout: 5000, socketTimeout: 5000 });
    if (res.statusCode < 200 || res.statusCode >= 300 || !res.body) {
        debug('Failed fetching credentials, statusCode: ', res.statusCode);
        throw new Error('Failed fetching credentials from ' + baseUrl);
    }

    var credentials;
    try {
        credentials = JSON.parse(res.body);
    } catch (e) {
        throw new Error('Error parsing response from ' + baseUrl + ': ' + e);
    }
    if (!credentials) {
        throw new Error('Error fetching tenant token from ' + baseUrl);
    }
    debug('Got credentials from:', baseUrl);
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
        tenanttoken: credentials.tenantToken ||  credentials.tenanttoken, // tenantToken comes from api, tenanttoken from cf-service
        loglevelcon: _consoleLogLevel()
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
    process.env.DT_APPLICATIONID = vcapApplication.application_name;
    process.env.DT_IGNOREDYNAMICPORT = "true";
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
    // process.env.DT_CLUSTER_ID = process.env.DYNO;

    if (process.env.HEROKU_APP_NAME) {
        process.env.DT_CLUSTER_ID = process.env.HEROKU_APP_NAME;
        process.env.DT_APPLICATIONID = process.env.HEROKU_APP_NAME;
    }

    process.env.DT_VOLATILEPROCESSGROUP = "true";
    process.env.DT_IGNOREDYNAMICPORT = "true";

    return nodeagent(_agentOptions(options));
}

function isAwsLambda() {
    return (process.env.AWS_LAMBDA_FUNCTION_NAME != undefined) && (process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE != undefined);
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
    throw new Error('AWS Lambda is not support by this package');
}
