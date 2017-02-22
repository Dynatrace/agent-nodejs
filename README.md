# Dynatrace npm module for PaaS

This module adds enterprise grade monitoring for Node.js in environments like Cloud Foundry or Heroku.
For any other environment please use the full installer provided in your Dynatrace environment.

## Installation
* [Sign up for free](https://www.dynatrace.com/trial/) and follow the instructions
* Click on "Deploy Dynatrace"
* Click on "Set up PaaS Integration"
* Generate a PaaS token
* Run `$ npm install --save @dynatrace/oneagent` in your project directory

### Deploying Dynatrace to CloudFoundry
* Set up the Dynatrace service broker using the credentials created in the previous step as described in our [documentation](https://help.dynatrace.com/monitor-paas-environments/cloudfoundry/how-do-i-monitor-cloudfoundry/)
* As first statement of your application add 
```js
try {
    require('@dynatrace/oneagent')();
} catch(err) {
    console.log(err.toString());
}
```
* Deploy the application to Cloud Foundry

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

## Disclaimer
This module is supported by the Dynatrace Innovation Lab.
Please create an issue for this repository if you need help.

## Licence
Licensed under the MIT License. See the LICENSE file for details.
