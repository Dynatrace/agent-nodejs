'use strict';

var fs = require('fs');
var path = require('path');
var request = require('sync-request');
var pathBase = null;
var nodeagent = null;
var debug = require('debug')('dynatrace')
var defaultServer = 'live.dynatrace.com';


var nodeagent = require('dynatrace-oneagent-nodejs');

function discoverCredentials(options) {

    if(!options.environmentid || !options.apitoken) {
        debug('No API token found - using legacy authentication');
        return options;
    }

    var uri = null;
    if(options.server) {
        uri = options.server + `/api/v1/deployment/installer/agent/connectioninfo?Api-Token=${options.apitoken}`;
    } else {
        uri = `https://${options.environmentid}.${defaultServer}/api/v1/deployment/installer/agent/connectioninfo?Api-Token=${options.apitoken}`;
    }

    debug('Trying to discover credentials from ', uri);

    var res = request('GET', uri);
    var credentials = JSON.parse(res.getBody('utf8'));

    debug('Got credentials from ', uri);

    if(!credentials) {
        throw new Error("Error fetching tenant token from " + uri);
    }

    return {
            server: options.server ? options.server : defaultServer,
            tenant: options.environmentid,
            tenanttoken: credentials.tenantToken,
            loglevelcon: 'none'
        };
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
        credentials = nodeagent(vcapServices['ruxit'][0].credentials);
    } else if (vcapServices['dynatrace'] && vcapServices['dynatrace'][0]) {
        credentials = nodeagent(vcapServices['dynatrace'][0].credentials);
    } else if (vcapServices['user-provided'] && vcapServices['user-provided'][0]) {
        credentials = nodeagent(vcapServices['user-provided'][0].credentials);
    } else {
        throw new Error('Error discovering credentials');
    }

    return nodeagent(discoverCredentials(credentials));

}

function handleHeroku(options, cb) {

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

    return nodeagent(discoverCredentials(options));
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

    return nodeagent(discoverCredentials(options));
    
};
