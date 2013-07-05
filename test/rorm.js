var thinky = require('../lib/index.js');
var should = require('should');
var r = require('rethinkdb');

//TODO Split test
//TODO Use something else than assert. should.js?

describe('Thinky', function(){
    // Testing pool
    describe('connect', function(){
        it('should create a pool', function(){
            thinky.connect({})
            should.exist(thinky.pool);
        })
    });
    describe('pool.acquire', function(){
        it('should provide a connection', function(){
            thinky.pool.acquire(function(err, client) {
                should.not.exist(err);
                should.exist(client);
                thinky.pool.release(client);
            });
        })
    });
    describe('pool', function(){
        it('should have more than one connection', function(){
            should(thinky.pool.getPoolSize() >= 1);
        })
    });


    // Testing get/set options
    describe('getOption', function(){
        it('should return the option passed', function(){
            should.equal(thinky.getOption('poolMax'), 10);
        })
    });
    describe('setOption', function(){
        it('should set an option', function(){
            var value = 7;
            thinky.setOption('poolMax', value);
            should.equal(thinky.getOption('poolMax'), value);
        })
    });

    describe('getOptions', function(){
        it('should return all options', function(){
            should.exist(thinky.getOptions());
        })
    });
    describe('setOptions', function(){
        it('should overwrite all options', function(){
            options = {
                poolMax: 20,
                poolMin: 2
            };
            thinky.setOptions(options, true);
            should.equal(thinky.getOptions(), options);
        })
    });
    describe('setOptions', function(){
        it('should merge by default all options', function(){
            var value = 4;
            thinky.setOption('poolMin', value);
            options = {
                poolMax: 30,
            };
            thinky.setOptions(options, false);
            should.equal(thinky.getOption('poolMax'), 30);
            should.equal(thinky.getOption('poolMin'), value);
        })
    });
    describe('setOptions', function(){
        it('should merge the new options', function(){
            var value = 5;
            thinky.setOption('poolMin', value);
            options = {
                poolMax: 30,
            };
            thinky.setOptions(options, false);
            should.equal(thinky.getOption('poolMax'), 30);
            should.equal(thinky.getOption('poolMin'), value);
        })
    });



})


