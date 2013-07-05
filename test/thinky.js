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
    describe('setOption', function(){
        it('should update the option', function(){
            var value = 4;
            thinky.setOption('poolMin', value);
            should.equal(thinky.getOption('poolMin'), value);
        })
        it('should use the default if the user pass null', function(){
            var value = null;
            thinky.setOption('poolMin', value);
            should.equal(thinky.getOption('poolMin'), 1);
        })

    });
    describe('setOptions', function(){
        it('should update all the provided options', function(){
            options = {
                poolMax: null,
                poolMin: 3
            };
            thinky.setOptions(options);
            should.equal(thinky.getOption('poolMax'), 10);
            should.equal(thinky.getOption('poolMin'), 3);
        })
    });
})


