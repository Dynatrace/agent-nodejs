# Dynatrace npm module for PaaS

This module adds enterprise grade monitoring for Node.js in PaaS environments that aren't supported by a dedicated integration (e.g. Heroku). Before using this module, please [review the Dynatrace documentation](https://www.dynatrace.com/support/help/infrastructure/) to make sure that there isn't already a marketplace integration or buildpack available for your platform.

## Installation
* [Sign up for free](https://www.dynatrace.com/trial/) and follow the instructions
* Click on "Deploy Dynatrace"
* Click on "Set up PaaS Integration"
* Generate a PaaS token
* Run `$ npm install --save @dynatrace/oneagent` in your project directory

### Deploying Dynatrace to Heroku
* Use the credentials created in the first step and add the following code block as first statement to your application

```js
try {
    require('@dynatrace/oneagent')({
        environmentid: '<environmentid>',
        apitoken: '<paastoken>',
    });
} catch(err) {
    console.log(err.toString());
}
```

* Deploy the application to Heroku

### Deploying Dynatrace to CloudFoundry
Starting with Dynatrace OneAgent 1.129 and [Cloud Foundry Node.js buildpack 1.6.10](https://github.com/cloudfoundry/nodejs-buildpack/releases/tag/v1.6.10) Dynatrace is part of the buildpack.
Using the buildpack is preferable to the npm module approach due to several improvements. For instance, you're no longer required to install a dependency on @dynatrace/oneagent in your project directory. You also no longer need to add a require statement as the first statement of your application. Please review the [Dynatrace product news](https://www.dynatrace.com/blog/support-for-node-js-apps-on-cloud-foundry-paas/) and [documentation](https://www.dynatrace.com/support/help/infrastructure/paas/how-do-i-monitor-cloud-foundry-applications/) to learn more.

## Disclaimer
This module is supported by the Dynatrace Innovation Lab.
Please create an issue for this repository if you need help.

## Licence
Licensed under the MIT License. See the LICENSE file for details.
