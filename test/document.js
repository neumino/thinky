var rorm = require('../lib/index.js');
var should = require('should');
var assert = require('assert');
var r = require('rethinkdb');

rorm.connect({})

describe('Document', function(){
    var Cat = rorm.createModel('Cat', { name: String });
    var catou, minou, catou_id;

    describe('new', function(){
        it('should create a new instance of the Model', function(){
            catou = new Cat({name: 'Catou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(catou.name, 'Catou');
        });
    });
    describe('new', function(){
        it('should create another new instance of the Model', function(){
            minou = new Cat({name: 'Minou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.name, 'Minou');
        });
    });
    describe('new', function(){
        it('should not change the previous instances', function(){
            catou = new Cat({name: 'Catou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(catou.name, 'Catou');
        });
    });
    describe('getDocument', function(){
        it('should return different objects', function(){
            should.exist(catou.getDocument());
            catou.getDocument().should.not.equal(minou.getModel());
        });
    });
    describe('getModel', function() {
        it('should return a model shared by all instances of the model', function(){
            should.exist(catou.getModel());
            should.equal(catou.getModel(), minou.getModel());
        });
    });
    describe('insert', function() {
        it('should add a field id', function(done){
            catou.insert( function(error, result) {
                if (error) throw error;
                should.exist(catou.id);
                catou_id = catou.id;
                done();
            })
        });
    });

    describe('get', function() {
        it('retrieve a document in the database', function(done){
            Cat.get(catou_id, function(error, result) {
                should.exist(result);
                done();
            })
        });
    });

})
