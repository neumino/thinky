var rorm = require('../lib/index.js');
var should = require('should');
var r = require('rethinkdb');

//TODO Split test
//TODO Use something else than assert. should.js?

describe('Rorm', function(){
    // Testing pool
    describe('connect', function(){
        it('should create a pool', function(){
            rorm.connect({})
            should.exist(rorm.pool);
        })
    });
    describe('pool.acquire', function(){
        it('should provide a connection', function(){
            rorm.pool.acquire(function(err, client) {
                should.not.exist(err);
                should.exist(client);
                rorm.pool.release(client);
            });
        })
    });
    describe('pool', function(){
        it('should have more than one connection', function(){
            should(rorm.pool.getPoolSize() >= 1);
        })
    });


    // Testing get/set options
    describe('getOption', function(){
        it('should return the option passed', function(){
            should.equal(rorm.getOption('poolMax'), 10);
        })
    });
    describe('setOption', function(){
        it('should set an option', function(){
            var value = 7;
            rorm.setOption('poolMax', value);
            should.equal(rorm.getOption('poolMax'), value);
        })
    });

    describe('getOptions', function(){
        it('should return all options', function(){
            should.exist(rorm.getOptions());
        })
    });
    describe('setOptions', function(){
        it('should overwrite all options', function(){
            options = {
                poolMax: 20,
                poolMin: 2
            };
            rorm.setOptions(options, true);
            should.equal(rorm.getOptions(), options);
        })
    });
    describe('setOptions', function(){
        it('should merge by default all options', function(){
            var value = 4;
            rorm.setOption('poolMin', value);
            options = {
                poolMax: 30,
            };
            rorm.setOptions(options, false);
            should.equal(rorm.getOption('poolMax'), 30);
            should.equal(rorm.getOption('poolMin'), value);
        })
    });
    describe('setOptions', function(){
        it('should merge the new options', function(){
            var value = 5;
            rorm.setOption('poolMin', value);
            options = {
                poolMax: 30,
            };
            rorm.setOptions(options, false);
            should.equal(rorm.getOption('poolMax'), 30);
            should.equal(rorm.getOption('poolMin'), value);
        })
    });



})


