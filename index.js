'use strict';

var fs = require('fs');
var path = require('path');

var pathBase = null;
var nodeagent = null;

var nodeagent = require('dynatrace-oneagent-nodejs');


function handleCloudFoundry(vcapServices, vcapApplication) {

    console.log('Cloud foundry environment detected.');
    process.env.RUXIT_APPLICATIONID = vcapApplication.application_name;
    process.env.RUXIT_CLUSTER_ID = vcapApplication.application_name;
    process.env.RUXIT_HOST_ID = vcapApplication.application_name + '_' + process.env.CF_INSTANCE_INDEX;
    process.env.RUXIT_IGNOREDYNAMICPORT = true;

    // Test with regex
    // Check for tenant and tenant token
    // Set server uri if no provided
    // https://xwn73283.dev.ruxitlabs.com:443/communication
    if (vcapServices['ruxit'] && vcapServices['ruxit'][0]) {
        return nodeagent(vcapServices['ruxit'][0].credentials);
    } else if (vcapServices['dynatrace'] && vcapServices['dynatrace'][0]) {
        return nodeagent(vcapServices['dynatrace'][0].credentials);
    } else if (vcapServices['user-provided'] && vcapServices['user-provided'][0]) {
        return nodeagent(vcapServices['user-provided'][0].credentials);
    } else {
        return credentialError();
    }
}

function handleHeroku(options) {

    console.log('Heroku environment detected.');

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
    return nodeagent(options);
}

function credentialError() {
    throw new Error('No credentials passed or set in environment!');
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
            return credentialError();
        }
    } else if (process.env.DYNO) {
        return handleHeroku(options);
    }
    return nodeagent(options);
};
