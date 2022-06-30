# Dynatrace npm module for PaaS

This module adds enterprise grade monitoring for Node.js in PaaS environments that aren't supported by a dedicated integration.
Before using this module, please [review the Dynatrace documentation](https://www.dynatrace.com/support/help/setup-and-configuration/setup-on-cloud-platforms) to
make sure that there isn't already a marketplace integration or buildpack available for your platform.

## Installation

* [Sign up for free](https://www.dynatrace.com/trial/) and follow the instructions
* Click on "Deploy Dynatrace"
* Click on "Set up PaaS Integration"
* Generate a PaaS token
* Run `$ npm install --save @dynatrace/oneagent` in your project directory
* Using the previously created credentials add the following code block as first statement to your application

```js
try {
  require('@dynatrace/oneagent')({
    environmentid: '<environmentid>',
    apitoken: '<paastoken>',
    endpoint: '<endpoint url>' // specify endpoint url - not needed for SaaS customers
  });
} catch (err) {
  console.log('Failed to load OneAgent: ', err);
}
```

### Deploying Dynatrace to AWS Lambda

Starting with Dynatrace OneAgent 1.207, Dynatrace offers a dedicated AWS Lambda layer to monitor Node.js based AWS Lambda functions. Please review the [Dynatrace product news](https://www.dynatrace.com/news/blog/dynatrace-extends-distributed-tracing-for-serverless-on-aws-lambda/) and [documentation](https://www.dynatrace.com/support/help/technology-support/cloud-platforms/amazon-web-services/integrations/deploy-oneagent-as-lambda-extension/) to learn more.

### Deploying Dynatrace to Heroku

Starting with Dynatrace OneAgent 1.141, Dynatrace offers a dedicated buildpack for Heroku. Please refer to our [documentation](https://www.dynatrace.com/support/help/how-to-use-dynatrace/infrastructure-monitoring/cloud-platform-monitoring/heroku-monitoring) for further instructions.

### Deploying Dynatrace to Cloud Foundry

Starting with Dynatrace OneAgent 1.131 and [Cloud Foundry Node.js buildpack 1.6.10](https://github.com/cloudfoundry/nodejs-buildpack/releases/tag/v1.6.10) Dynatrace is part of the buildpack.
Using the buildpack is preferable to the npm module approach due to several improvements. For instance,
you're no longer required to install a dependency on `@dynatrace/oneagent` in your project directory.
You also no longer need to add a require statement as the first statement of your application.
Please review the [Dynatrace product news](https://www.dynatrace.com/blog/support-for-node-js-apps-on-cloud-foundry-paas/)
and [documentation](https://www.dynatrace.com/support/help/setup-and-configuration/setup-on-container-platforms/cloud-foundry/deploy-oneagent-on-pivotal-web-services-for-application-only-monitoring)
to learn more.

### Emitting debug output

To enable debug output set the `DEBUG` environment variable to `dynatrace*`. For more detail see the [debug module documentation](https://www.npmjs.com/package/debug).

## Licence

Licensed under the MIT License. See the LICENSE file for details.
