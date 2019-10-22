var expect = require('chai').expect;
var util = require('util');

var testData;
try {
    testData = require('./data')
} catch (e) {
    // running w/o test data
}

if (testData != null) {
    /*
    describe('Agent loader outside of known PaaS env', function () {
        this.timeout(15000);

        it('should return with _rx.cfg set', function (done) {
            require('../index')({
                    server: testData.server,
                    tenant: testData.environmentid,
                    tenanttoken: testData.tenanttoken
                }
            );

            expect(process.env.RUXIT_HOST_ID).to.not.be.defined;
            expect(process.env.RUXIT_CLUSTER_ID).to.not.be.defined;
            expect(process.env.RUXIT_APPLICATIONID).to.not.be.defined;
            expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.not.be.defined;
            expect(global._rx_cfg).to.be.defined;

            done();
        });

        it('should throw with no credentials given', function (done) {

            expect(function () {
                require('../index')()
            }).to.throw(Error);
            done();
        });
    });*/

    describe('Agent loader outside of known PaaS env using apitoken', function () {
        this.timeout(15000);

        it('should return with _rx.cfg set', function (done) {
            require('../index')({
                server: testData.server,
                tenant: testData.environmentid,
                apitoken: testData.apitoken
            }
            );

            expect(process.env.RUXIT_HOST_ID).to.not.be.defined;
            expect(process.env.RUXIT_CLUSTER_ID).to.not.be.defined;
            expect(process.env.RUXIT_APPLICATIONID).to.not.be.defined;
            expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.not.be.defined;
            expect(global._rx_cfg).to.be.defined;

            done();
        });

        it('should throw with no credentials given', function (done) {

            expect(function () {
                require('../index')()
            }).to.throw(Error);
            done();
        });
    });

    /*
    describe("Agent loader within Cloud Foundry VCAP_SERVICES['ruxit'] set", function () {
        this.timeout(15000);


        it("should set global and environment variables", function (done) {
            var vcapServices = {
                'ruxit-service': [{
                        "credentials": {
                            "server": testData.server,
                            "tenant": testData.environmentid,
                            "tenanttoken": testData.tenanttoken
                        },
                        "label": "ruxit",
                        "name": "test-1",
                        "plan": 'someplan',
                        "tags": [
                            "ruxit",
                            "performance",
                            "monitoring",
                            "apm",
                            "analytics"
                        ]
                    }
                ]
            };

            var vcapApplication = {
                "application_name" : "test-1"
            };

            process.env.VCAP_APPLICATION = JSON.stringify(vcapApplication);

            process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
            process.env.CF_INSTANCE_INDEX = 1;


            require('../index')();

            expect(process.env.RUXIT_HOST_ID).to.be.defined;
            // expect(process.env.RUXIT_CLUSTER_ID).to.be.defined;
            expect(process.env.RUXIT_APPLICATIONID).to.equal('test-1');
            expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.be.defined;

            expect(global._rx_cfg).to.be.defined;
            done();
        });
    });
    */

    describe("Agent loader within Cloud Foundry VCAP_SERVICES['dynatrace-service'] set using apitoken", function () {
        this.timeout(15000);


        it("should set global and environment variables", function (done) {
            var vcapServices = {
                'dynatrace-service': [{
                    "credentials": {
                        "server": testData.server,
                        "tenant": testData.environmentid,
                        "apitoken": testData.apitoken
                    },
                    "label": "ruxit",
                    "name": "test-1",
                    "plan": 'someplan',
                    "tags": [
                        "ruxit",
                        "performance",
                        "monitoring",
                        "apm",
                        "analytics"
                    ]
                }
                ]
            };

            var vcapApplication = {
                "application_name": "test-1"
            };

            process.env.VCAP_APPLICATION = JSON.stringify(vcapApplication);

            process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
            process.env.CF_INSTANCE_INDEX = 1;


            require('../index')();

            expect(process.env.RUXIT_HOST_ID).to.be.defined;
            // expect(process.env.RUXIT_CLUSTER_ID).to.be.defined;
            expect(process.env.RUXIT_APPLICATIONID).to.equal('test-1');
            expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.be.defined;

            expect(global._rx_cfg).to.be.defined;
            done();
        });
    });

    describe("Agent loader within Cloud Foundry VCAP_SERVICES['dynatrace-service'] set using apitoken and apiurl", function () {
        this.timeout(15000);


        it("should set global and environment variables", function (done) {
            var vcapServices = {
                'dynatrace-service': [{
                    "credentials": {
                        "server": testData.server,
                        "tenant": testData.environmentid,
                        "apitoken": testData.apitoken,
                        "apiurl": testData.apiurl,
                    },
                    "label": "ruxit",
                    "name": "test-1",
                    "plan": 'someplan',
                    "tags": [
                        "ruxit",
                        "performance",
                        "monitoring",
                        "apm",
                        "analytics"
                    ]
                }
                ]
            };

            var vcapApplication = {
                "application_name": "test-1"
            };

            process.env.VCAP_APPLICATION = JSON.stringify(vcapApplication);

            process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
            process.env.CF_INSTANCE_INDEX = 1;


            require('../index')();

            expect(process.env.RUXIT_HOST_ID).to.be.defined;
            // expect(process.env.RUXIT_CLUSTER_ID).to.be.defined;
            expect(process.env.RUXIT_APPLICATIONID).to.equal('test-1');
            expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.be.defined;

            expect(global._rx_cfg).to.be.defined;
            done();
        });
    });

    /*
    describe("Agent loader within Cloud Foundry VCAP_SERVICES['user-provided'] set", function () {
        this.timeout(15000);

        it("should set global and environment variables", function (done) {

            var vcapServices = {
                'user-provided': [
                    {
                        "credentials": {
                            "server": testData.server,
                            "tenant": testData.environmentid,
                            "tenanttoken": testData.tenanttoken
                        },
                        "label": "user-provided",
                        "name": "test-2",
                        "syslog_drain_url": "",
                        "tags": []
                    },
                    {
                        "credentials": {
                            "server": testData.server,
                            "tenant": testData.environmentid,
                            "tenanttoken": testData.tenanttoken
                        },
                        "label": "dynatrace-service",
                        "name": "test-3",
                        "syslog_drain_url": "",
                        "tags": []
                    }
                ]
            };

            var vcapApplication = {
                "application_name" : "test-3"
            };
            process.env.VCAP_APPLICATION = JSON.stringify(vcapApplication);

            process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
            process.env.CF_INSTANCE_INDEX = 2;
            process.env.VCAP_SERVICES = JSON.stringify(vcapServices);



            require('../index')();

            expect(process.env.RUXIT_HOST_ID).to.be.defined;
            expect(process.env.RUXIT_CLUSTER_ID).to.be.defined;
            expect(process.env.RUXIT_APPLICATIONID).to.equal('test-3');
            expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.be.defined;

            expect(global._rx_cfg).to.be.defined;
            done();
        });
    });
    */


    describe("Agent loader within Cloud Foundry VCAP_SERVICES['user-provided'] set using apitoken and tags", function () {
        this.timeout(15000);

        it("should set global and environment variables", function (done) {

            var vcapServices = {
                'user-provided': [
                    {
                        "credentials": {
                            "server": testData.server,
                            "tenant": testData.environmentid,
                            "tenanttoken": testData.tenanttoken
                        },
                        "label": "user-provided",
                        "name": "test-2",
                        "syslog_drain_url": "",
                        "tags": []
                    },
                    {
                        "credentials": {
                            "server": testData.server,
                            "tenant": testData.environmentid,
                            "aüitoken": testData.apitoken
                        },
                        "label": "some-service",
                        "name": "test-3",
                        "syslog_drain_url": "",
                        "tags": ['foo', 'bar', 'dynatrace']
                    }
                ]
            };

            var vcapApplication = {
                "application_name": "test-3"
            };
            process.env.VCAP_APPLICATION = JSON.stringify(vcapApplication);

            process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
            process.env.CF_INSTANCE_INDEX = 2;
            process.env.VCAP_SERVICES = JSON.stringify(vcapServices);



            require('../index')();

            expect(process.env.RUXIT_HOST_ID).to.be.defined;
            expect(process.env.RUXIT_CLUSTER_ID).to.be.defined;
            expect(process.env.RUXIT_APPLICATIONID).to.equal('test-3');
            expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.be.defined;

            expect(global._rx_cfg).to.be.defined;
            done();
        });


    });
}