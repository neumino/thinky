var thinky = require('../lib/index.js');
var config = require('../config.js');
var should = require('should');
var r = require('rethinkdb');

//TODO Split test
//TODO Use something else than assert. should.js?

describe('Thinky', function(){
    // Testing pool
    describe('init', function(){
        it('should create a pool', function(){
            thinky.init({
                host: config.host,
                port: config.port,
                db: config.db
            })

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
    describe('timeFormat', function(){
        it('should have timeFormat work with `raw`', function(done){
            thinky.setOption('timeFormat', 'raw');
            var date = new Date();
            var dateObj = {
                $reql_type$: 'TIME',
                epoch_time: date.getTime()/1000,
                timezone: '+00:00'
            }

            var Cat = thinky.createModel('Cat', { id: String, name: String, date: Date });
            var catou = new Cat({name: 'Catou', date: dateObj});

            catou.save(null, function(error, result) {
                should.equal(result.date.$reql_type$, 'TIME')
                should.equal(result.date.epoch_time, date.getTime()/1000)

                Cat.get(catou.id).run(function(error, result) {
                    should.equal(result.date.$reql_type$, 'TIME')
                    should.equal(result.date.epoch_time, date.getTime()/1000)

                    // Switching back to default settings
                    thinky.setOption('timeFormat', 'native');
                    done();
                });
            });

        })
    });

    describe('getOptions', function(){
        it('should return all options', function(){
            should.exist(thinky.getOptions().host);
            should.exist(thinky.getOptions().port);
            should.exist(thinky.getOptions().db);
            should.exist(thinky.getOptions().poolMax);
            should.exist(thinky.getOptions().poolMin);
            should.exist(thinky.getOptions().enforce);
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
        it('should create a new pool if the user change the host', function(){
            var previousPool = thinky.pool;
            var value = 'xx.xx.xx.xx'; // non valid host

            thinky.setOption('host', value);

            should(previousPool);
            should(thinky.pool);
            thinky.pool.should.not.equal(previousPool);

            thinky.setOption('host', config.host);
        })
        it('should create a new pool if the user change the port', function(){
            var previousPool = thinky.pool;
            var value = '28015';

            thinky.setOption('port', value);

            should(previousPool);
            should(thinky.pool);
            thinky.pool.should.not.equal(previousPool);
        })
        it('should create a new pool if the user change poolMax', function(){
            var previousPool = thinky.pool;
            var value = '11';

            thinky.setOption('poolMax', value);

            should(previousPool);
            should(thinky.pool);
            thinky.pool.should.not.equal(previousPool);
        })
        it('should create a new pool if the user change poolMin', function(){
            var previousPool = thinky.pool;
            var value = '2';

            thinky.setOption('poolMin', value);

            should(previousPool);
            should(thinky.pool);
            thinky.pool.should.not.equal(previousPool);
        })


        it('should be able to change the db', function(done){
            var value = 'whateverDBThatDoesNotExist';
            thinky.setOption('db', value);
            Cat = thinky.createModel('Cat', { id: String, name: String });
            catou = new Cat({name: 'Catou'});
            catou.save(function(error, result) {
                should.equal(error.name, 'RqlRuntimeError');
                thinky.setOption('db', 'test');
                done();
            })
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


