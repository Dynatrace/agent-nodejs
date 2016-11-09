'use strict';

var fs = require('fs');
var path = require('path');
var request = require('sync-request');
var pathBase = null;
var nodeagent = null;
var debug = require('debug')('dynatrace')
var defaultServer = 'live.dynatrace.com';




var nodeagent = require('dynatrace-oneagent-nodejs');

function _tenant(options) {
    return options['environmentid'] || options['server'];
}

function _tenanttoken(options) {

    if (!options.environmentid || !options.apitoken) {
        debug('No API token found - using legacy authentication');
        return options;
    }

    var uri = null;
    uri = _server(options) + `/api/v1/deployment/installer/agent/connectioninfo?Api-Token=${options.apitoken}`;

    debug('Trying to discover credentials from ', uri);

    var res = request('GET', uri);
    var credentials = JSON.parse(res.getBody('utf8'));

    debug('Got credentials from ', uri);

    if (!credentials) {
        throw new Error("Error fetching tenant token from " + uri);
    }

    return credentials.tenantToken;
}

function _server(options) {
    return options['endpoint'] || options['server'] || "https://#{_tenant(credentials)}.live.dynatrace.com";
}

function _agentOptions(options) {
    return {
        server: _server(options),
        tenant: _tenant(options),
        tenanttoken: _tenanttoken(options),
    }
}

let x = {
    "VCAP_SERVICES": {
        "user-provided": [
            {
                "credentials": {
                    "apitoken": "jvbyp3qUTR6rGZwQI1fTx",
                    "environmentid": "kwl61035"
                },
                "label": "user-provided",
                "name": "dynatrace-api",
                "syslog_drain_url": "",
                "tags": [],
                "volume_mounts": []
            }
        ]
    }
}

let y = {
    "VCAP_SERVICES": {
        "dynatrace": [
            {
                "credentials": {
                    "apitoken": "jvbyp3qUTR6rGZwQI1fTx",
                    "environmentid": "kwl61035"
                },
                "label": "dynatrace",
                "name": "kwl",
                "plan": "kwl",
                "provider": null,
                "syslog_drain_url": null,
                "tags": [
                    "dynatrace",
                    "performance",
                    "monitoring",
                    "apm",
                    "analytics"
                ],
                "volume_mounts": []
            }
        ]
    }
}



function handleCloudFoundry(vcapServices, vcapApplication) {

    debug('Cloud foundry environment detected.');
    process.env.RUXIT_APPLICATIONID = vcapApplication.application_name;
    // process.env.RUXIT_CLUSTER_ID = vcapApplication.application_name;
    process.env.RUXIT_HOST_ID = vcapApplication.application_name + '_' + process.env.CF_INSTANCE_INDEX;
    process.env.RUXIT_IGNOREDYNAMICPORT = true;

    // Test with regex
    // Check for tenant and tenant token
    // Set server uri if no provided
    // https://xwn73283.dev.ruxitlabs.com:443/communication

    var credentials = null;

    if (vcapServices['ruxit'] && vcapServices['ruxit'][0]) {
        credentials = vcapServices['ruxit'][0].credentials;
    } else if (vcapServices['dynatrace'] && vcapServices['dynatrace'][0]) {
        credentials = vcapServices['dynatrace'][0].credentials;
    } else if (vcapServices['user-provided']) {
        credentials = vcapServices['user-provided'][0].credentials;
    } else {
        throw new Error('Error discovering credentials');
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
    process.env.RUXIT_IGNOREDYNAMICPORT = true;

    return nodeagent(_agentOptions(options));
}

module.exports = function agentLoader(options) {
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

};
