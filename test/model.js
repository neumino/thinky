var thinky = require('../lib/index.js');
var should = require('should');
var assert = require('assert');
var r = require('rethinkdb');
var _ = require('underscore');

thinky.connect({})

describe('Model', function(){
    var Cat, catou, minou, catou_id, catouCopy, minouCopy;
    describe('createModel', function(){
        it('Create model', function(){
            Cat = thinky.createModel('Cat', { name: String });
            should.exist(Cat);
        });
    });

    // Test new
    describe('new', function(){
        it('should create a new instance of the Model', function() {
            catou = new Cat({name: 'Catou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(catou.name, 'Catou');
        });
    });
    describe('new', function(){
        it('should create another new instance of the Model', function() {
            minou = new Cat({name: 'Minou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.name, 'Minou');
        });
    });
    describe('new', function(){
        it('should not change the previous instances', function() {
            catou = new Cat({name: 'Catou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(catou.name, 'Catou');
        });
    });

    // Test schema
    describe('new', function(){
        it('should save String fields', function() {
            Cat = thinky.createModel('Cat', { fieldString: String });
            minou = new Cat({fieldString: 'Minou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
        it('should save String fields (enforce = true)', function() {
            minou = new Cat({fieldString: 'Minou'}, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
    });
    describe('new', function(){
        it('should save Number fields', function() {
            Cat = thinky.createModel('Cat', { fieldNumber: Number });
            var value = Math.random();
            minou = new Cat({fieldNumber: value});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldNumber, value);
        });
        it('should save Number fields (enforce = true)', function() {
            var value = Math.random();
            minou = new Cat({fieldNumber: value}, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldNumber, value);
        });
    });
    describe('new', function(){
        it('should save Boolean fields', function() {
            Cat = thinky.createModel('Cat', { fieldBoolean: Boolean });
            var value = (Math.random > 0.5)? true: false;
            minou = new Cat({fieldBoolean: value});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldBoolean, value);
        });
        it('should save Boolean fields (enforce = true)', function() {
            var value = (Math.random > 0.5)? true: false;
            minou = new Cat({fieldBoolean: value}, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldBoolean, value);
        });
    });
    describe('new', function(){
        it('should save Nested fields', function() {
            Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            var value = "Hello, I'm a nested string field"
            minou = new Cat({ nested: { fieldString: value}});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested.fieldString, value);
        });
        it('should save Boolean fields (enforce = true)', function() {
            var value = "Hello, I'm a nested string field"
            minou = new Cat({nested: { fieldString: value}}, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested.fieldString, value);
        });
    });
    describe('new', function(){
        it('should save double nested fields', function() {
            Cat = thinky.createModel('Cat', { nested: { nestedBis: {fieldString: String }}});
            var value = "Hello, I'm a nested string field"
            minou = new Cat({ nested: { nestedBis: {fieldString: value}}});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested.nestedBis.fieldString, value);
        });
        it('should save double nested fields (enforce = true)', function() {
            var value = "Hello, I'm a nested string field"
            minou = new Cat({ nested: { nestedBis: {fieldString: value}}}, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested.nestedBis.fieldString, value);
        });
    });
    describe('new', function(){
        it('should save Array fields', function() {
            var value = ["a", "b", "c"]
            Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            minou = new Cat({ arrayOfStrings: value });
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
        it('should save Array fields (enforce = true)', function() {
            var value = ["a", "b", "c"]
            minou = new Cat({ arrayOfStrings: value }, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
    });
    describe('new', function(){
        it('should save Array or Array fields', function() {
            var value = [["a", "b"], ["c", "d"], ["e"]];
            Cat = thinky.createModel('Cat', { arrayOfStrings: [[String]] });
            minou = new Cat({ arrayOfStrings: value });
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
        it('should save Array or Array fields (enforce = true)', function() {
            var value = [["a", "b"], ["c", "d"], ["e"]];
            Cat = thinky.createModel('Cat', { arrayOfStrings: [[String]] });
            minou = new Cat({ arrayOfStrings: value }, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
    });
    describe('new', function(){
        it('should save Array of objects', function() {
            var value = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
            Cat = thinky.createModel('Cat', { arrayOfObjects: [{ key: String}] });
            minou = new Cat({ arrayOfObjects: value });
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfObjects.length, value.length);
        });
        it('should save Array of objects (enforce = true)', function() {
            var value = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
            minou = new Cat({ arrayOfObjects: value }, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should(_.isEqual(minou.arrayOfObjects, value));
        });
    });

    // Test schema with options 
    describe('new', function(){
        it('should save String fields', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String }});
            minou = new Cat({fieldString: 'Minou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
        it('should miss the  String field', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String }});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, undefined);
        });
        it('should use the default value', function() {
            var value = "noString";
            Cat = thinky.createModel('Cat', { fieldString: {_type: String, default: value }});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should use the default function', function() {
            var value = "noString";
            Cat = thinky.createModel('Cat', { fieldString: {_type: String, default: function() { return value }}});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should use the default function with the original doc', function() {
            var value = "noString";
            Cat = thinky.createModel('Cat', { fieldString: {_type: String, default: function(doc) { return doc.value }}});
            minou = new Cat({value: value});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });




        it('should save String fields (enforce = true)', function() {
            minou = new Cat({fieldString: 'Minou'}, {enforce: true});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
    });

    
    // Test schema errors
    describe('new', function(){
        it('should throw when enforcce=true with a wrong type (string)', function() {
            Cat = thinky.createModel('Cat', { fieldString: String });
            (function() { new Cat({fieldString: 1}, {enforce: true}); }).should.throw('Value for [fieldString] must be a String');
        });
    });
    describe('new', function(){
        it('should throw when enforcce=true with a wrong type (number)', function() {
            Cat = thinky.createModel('Cat', { fieldNumber: Number });
            (function() { new Cat({fieldNumber: 'not_number'}, {enforce: true}); }).should.throw('Value for [fieldNumber] must be a Number');
        });
    });
    describe('new', function(){
        it('should throw when enforcce=true with a wrong type (bool)', function() {
            Cat = thinky.createModel('Cat', { fieldBool: Boolean });
            (function() { new Cat({fieldBool: 'not_bool'}, {enforce: true}); }).should.throw('Value for [fieldBool] must be a Boolean');
        });
    });
    describe('new', function(){
        it('should save Array fields (enforce = true)', function() {
            var value = ["a", 1, "c"]
            Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            (function() {  new Cat({ arrayOfStrings: value }, {enforce: true}) }).should.throw('Value for [arrayOfStrings][1] must be a String');
        });
    });
    describe('new', function(){
        it('should use the default function with the original doc', function() {
            var value = "noString";
            Cat = thinky.createModel('Cat', { fieldString: {_type: String, default: function(doc) { return 1 }}});
            (function() { new Cat({value: value}, {enforce: true}) }).should.throw('The default function did not return a String for [fieldString]');
        });
    });

    // Testing enforce true at the model level
    describe('new', function(){
        it('should throw when enforcce=true (declared in the model) with a wrong type (string)', function() {
            Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: true});
            (function() { new Cat({fieldString: 1}) }).should.throw('Value for [fieldString] must be a String');
        });
    });
   






    // Test define
    describe('define', function() {
        it('should save a method', function() {
            Cat = thinky.createModel('Cat', { name: String });
            Cat.define('hello', function() { return 'hello, my name is '+this.name; })
            catou = new Cat({name: 'Catou'});
            should.exist(Cat.hello)
        });
    });
    describe('define', function(){
        it('should define the function for previously created documents', function(){
            should.exist(catou.hello);
            should.equal(catou.hello(), 'hello, my name is Catou');
        });
    });
    describe('define', function(){
        it('should define the function for newly created documents', function(){
            catou = new Cat({name: 'Catou'});
            should.exist(catou.hello);
            should.equal(catou.hello(), 'hello, my name is Catou');
        });
    });


    // Test again a database
    describe('save', function() {
        it('should add a field id', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String });
            catou = new Cat({name: 'Catou'});
            catou.save( function(error, result) {
                catouCopy = result;

                should.exist(result.id);
                minou = new Cat({name: 'Minou'});
                minou.save( function(error, result) {
                    minouCopy = result;
                    done();
                });
            });
        });
    });



    describe('get', function() {
        it('retrieve a document in the database', function(done){
            Cat.get(catouCopy.id, function(error, result) {
                should(_.isEqual(result, catouCopy));
                done();
            })
        });
    });
    describe('get', function() {
        it('retrieve documents in the database', function(done){
            Cat.get([catouCopy.id, minouCopy.id], function(error, result) {
                should.not.exists(error);
                result.should.have.length(2);
                should.equal(result[0].id, catouCopy.id);
                done();
            })
        });
    });
    describe('filter', function() {
        it('retrieve documents in the database', function(done){
            Cat.filter(function(doc) { return r.expr([catouCopy.id, minouCopy.id]).contains(doc("id")) },
                function(error, result) {
                    should.not.exists(error);
                    result.should.have.length(2);
                    done();
                }
            )
        });
    });
    describe('count', function() {
        it('should return the number of document in the table', function(done){
            Cat.filter(function(doc) { return true },
                function(error, result) {
                    should.not.exists(error);
                    Cat.count( function(error, resultCount) {
                        should.not.exists(error);
                        result.should.have.length(resultCount);
                        done();
                    });
                }
            )
        });
    });
})
