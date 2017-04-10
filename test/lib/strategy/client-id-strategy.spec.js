var assert = require('assert');
var express = require('express');
var sinon = require('sinon');

var Store = require('../../../lib/stores/Store');
var utils = require('../../../lib/utils');

var strategy = require('../../../lib/strategy/client-id-strategy');

describe("client-id-strategy",function () {

    var validOptions = {
        strategy: {
            type :  "client-id",
            paths : {
                "clientId" : "customObj.clientId"
            }
        }
    };

    var invalidOptions = {
        strategy: {
            type :  "access-token",
            paths : {
                "clientId" : "invalid.path"
            }
        }
    };

    var validReq = {
        connection : {
            remoteAddress : "1.1.1.1"
        },
        customObj : {
            clientId : "asdasdaskdjasbjk"
        }
    };
    var invalidReq = "invalid";
    //@todo : should this be mocked in some way?
    var store = new Store();

    var utilStub = null;
    var storeStub = null;

    beforeEach(function () {
        utilStub = sinon.stub(utils,"getUTCHourIndex");
        storeStub = sinon.stub(store,"incr",function () {
            return Promise.resolve({});
        });
    });
    
    afterEach(function () {
       utilStub.restore();
       storeStub.restore();
    });
    
    it("should throw an error if remoteAddress is missing", function(done){
            var tempReq = Object.assign({}, validReq, {connection:{remoteAddress:null}} );
            try {
                strategy(tempReq, validOptions, store);
            } catch(e){
                assert.equal(e.message,"invalid request, connection remoteAddress missing");
                assert.equal(e instanceof Error, true);
                done();
            }
    });
    it("should throw an error if invalid req object is passed",function (done) {
            try {
                strategy(invalidReq,validOptions,store);
            } catch(e){
                assert.equal(e.message,"invalid req object passed");
                assert.equal(e instanceof Error, true);
                done();
            }
        });

    it("should throw an error if an invalid STORE object is passed",function (done) {
        try {
            strategy(validReq,validOptions,new Object());
        } catch(e){
            assert.equal(e.message,"Config Error : invalid store passed");
            assert.equal(e instanceof Error, true);
            done();
        }
    });

    it("should throw an error if no valid path in strategy",function (done) {
        try {
            var alteredOptions = JSON.parse(JSON.stringify(validOptions));
            alteredOptions.strategy.paths = {};
            strategy(validReq, alteredOptions, store);
        } catch(e){
            assert.equal(e.message,"Config Error : invalid options.strategy passed");
            assert.equal(e instanceof Error, true);
            done();
        }
    });
    it("should throw an error, if no accessToken present at the specified location",function (done) {
        try {
            strategy(validReq, invalidOptions, store);
        } catch(e){
            assert.equal(e.message,"invalid clientId found in req object - undefined at path - req.invalid.path");
            assert.equal(e instanceof Error, true);
            done();
        }
    });

    it("should return call store.incr and utils.getUTCHourIndex if accessToken present",function (done) {
        strategy(validReq, validOptions, store);
        sinon.assert.calledOnce(storeStub);
        sinon.assert.calledOnce(utilStub);
        done();
    });

    it("should return a Promise object when increment request goes through successfully",function (done) {
        var promise = strategy(validReq, validOptions, store);
        assert.equal(promise instanceof Promise, true);
        done();
    });

});