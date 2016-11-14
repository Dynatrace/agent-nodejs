# Dynatrace npm module for PaaS

This module adds enterprise grade monitoring for Node.js in environments like Pivotal CloudFoundry or Heroku.
For any other environment please use the full installer provided in your Dynatrace environment.

## Installation
* [Sign up for free](https://www.dynatrace.com/trial/) and follow the instructions
* Click on "Deploy Dynatrace"
* Click on "Set up PaaS Integration"
* Generate an API token
* Run `$ npm install --save dynatrace` in your project directory

### Deploying Dynatrace to CloudFoundry
* Set up the Dynatrace service broker using the credentials created in the previopus step as described in the [Pivotal documentation](https://docs.pivotal.io/dynatrace/installing.html)
* As first statement of your application add 
```js
try {
    require('dynatrace')();
} catch(err) {
    console.log(err.toString());
}
```
* Deploy the application to CloudFoundry

### Deploying Dynatrace to Heroku
* Use the credentials created in the first step and add the following code block as first statement to your application

```js
try {
    require('dynatrace')({
        environmentid: '<environmentid>',
        apitoken: '<apitoken>',
    });
} catch(err) {
    console.log(err.toString());
}
```

* Deploy the application to Heroku

# Disclaimer
This module is supported by the Dynatrace Innovation Lab.
Please create an issue for this repository if you need help.

# Licence
Licensed under the MIT License. See the LICENSE file for details.