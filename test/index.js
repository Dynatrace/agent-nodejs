var expect = require('chai').expect;
var util = require('util');

if (!process.env.test_server) throw new Error("Node 'testoptions' environment variable found");

describe('Agent loader outside of known PaaS env', function () {
    this.timeout(15000);

    it('should return with _rx.cfg set', function (done) {
        require('../index')({
                server: process.env.test_server,
                tenant: process.env.test_tenant,
                tenanttoken: process.env.test_tenanttoken,
                loglevelcon: process.env.test_loglevelcon
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

describe("Agent loader within Cloud Foundry VCAP_SERVICES['ruxit'] set", function () {
    this.timeout(15000);


    it("should set global and environment variables", function (done) {
        var vcapServices = {
            'ruxit': [
                {
                    "credentials": {
                        "server": process.env.test_server,
                        "tenant": process.env.test_tenant,
                        "tenanttoken": process.env.test_tenanttoken
                    },
                    "label": "ruxit",
                    "name": "test-1",
                    "plan": process.env.test_tenant,
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
        expect(process.env.RUXIT_CLUSTER_ID).to.be.defined;
        expect(process.env.RUXIT_APPLICATIONID).to.equal('test-1');
        expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.be.defined;

        expect(global._rx_cfg).to.be.defined;
        done();
    });
});

describe("Agent loader within Cloud Foundry VCAP_SERVICES['user-provided'] set", function () {
    this.timeout(15000);

    it("should set global and environment variables", function (done) {

        var vcapServices = {
            'user-provided': [
                {
                    "credentials": {
                        "server": process.env.test_server,
                        "tenant": process.env.test_tenant,
                        "tenanttoken": process.env.test_tenanttoken
                    },
                    "label": "user-provided",
                    "name": "test-2",
                    "syslog_drain_url": "",
                    "tags": []
                }
            ]
        };

        var vcapApplication = {
            "application_name" : "test-2"
        };
        process.env.VCAP_APPLICATION = JSON.stringify(vcapApplication);

        process.env.VCAP_SERVICES = JSON.stringify(vcapServices);
        process.env.CF_INSTANCE_INDEX = 2;
        process.env.VCAP_SERVICES = JSON.stringify(vcapServices);

        require('../index')();

        expect(process.env.RUXIT_HOST_ID).to.be.defined;
        expect(process.env.RUXIT_CLUSTER_ID).to.be.defined;
        expect(process.env.RUXIT_APPLICATIONID).to.equal('test-2');
        expect(process.env.RUXIT_IGNOREDYNAMICPORT).to.be.defined;

        expect(global._rx_cfg).to.be.defined;
        done();
    });
});