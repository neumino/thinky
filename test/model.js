var thinky = require('../lib/index.js');
var should = require('should');
var assert = require('assert');
var r = require('rethinkdb');
var _ = require('underscore');

thinky.init({})

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
        // Testing basic types - Are they saved?
        it('should save String fields', function() {
            Cat = thinky.createModel('Cat', { fieldString: String });
            minou = new Cat({fieldString: 'Minou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
        it('should save Number fields', function() {
            Cat = thinky.createModel('Cat', { fieldNumber: Number });
            var value = Math.random();
            minou = new Cat({fieldNumber: value});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldNumber, value);
        });
        it('should save Boolean fields', function() {
            Cat = thinky.createModel('Cat', { fieldBoolean: Boolean });
            var value = (Math.random > 0.5)? true: false;
            minou = new Cat({fieldBoolean: value});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldBoolean, value);
        });
        it('should save Nested fields', function() {
            Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            var value = "Hello, I'm a nested string field"
            minou = new Cat({ nested: { fieldString: value}});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested.fieldString, value);
        });
        it('should save Array fields', function() {
            Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            var value = ["a", "b", "c"]
            minou = new Cat({ arrayOfStrings: value });
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
        it('should save double nested fields', function() {
            Cat = thinky.createModel('Cat', { nested: { nestedBis: {fieldString: String }}});
            var value = "Hello, I'm a nested string field"
            minou = new Cat({ nested: { nestedBis: {fieldString: value}}});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested.nestedBis.fieldString, value);
        });
        it('should save Array or Array fields', function() {
            var value = [["a", "b"], ["c", "d"], ["e"]];
            Cat = thinky.createModel('Cat', { arrayOfStrings: [[String]] });
            minou = new Cat({ arrayOfStrings: value });
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
        it('should save Array of objects', function() {
            var value = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
            Cat = thinky.createModel('Cat', { arrayOfObjects: [{ key: String}] });
            minou = new Cat({ arrayOfObjects: value });
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfObjects.length, value.length);
        });

        // Testing basic types - They should be ignored if not provided
        it('should by default ignore String fields if not provided', function() {
            Cat = thinky.createModel('Cat', { fieldString: String });
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, undefined);
        });
        it('should by default ignore Number fields if not provided', function() {
            Cat = thinky.createModel('Cat', { fieldNumber: Number });
            var value = Math.random();
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldNumber, undefined);
        });
        it('should by default ignore Boolean fields if not provided', function() {
            Cat = thinky.createModel('Cat', { fieldBoolean: Boolean });
            var value = (Math.random > 0.5)? true: false;
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldBoolean, undefined);
        });
        it('should by default ignore Nested fields if not provided -- at nested level', function() {
            Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            minou = new Cat({ nested: {}});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested.fieldString, undefined);
        });
        it('should by default ignore Nested fields if not provided -- at first level', function() {
            Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.nested, undefined);
        });
        it('should by default ignore Array fields if not provided', function() {
            Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.arrayOfStrings, undefined);
        });

        // Testing basic types - An error should be thrown if the type does not match
        it('should by default throw if a String field have another non null type', function() {
            Cat = thinky.createModel('Cat', { fieldString: String });
            (function() { minou = new Cat({fieldString: 1}) }).should.throw('Value for [fieldString] must be a String')
        });
        it('should by default throw if a Number field have another non null type', function() {
            Cat = thinky.createModel('Cat', { fieldNumber: Number });
            var value = Math.random();
            (function() { minou = new Cat({fieldNumber: 'string'}) }).should.throw('Value for [fieldNumber] must be a Number')
        });
        it('should by default throw if a Boolean field have another non null type', function() {
            Cat = thinky.createModel('Cat', { fieldBoolean: Boolean });
            (function() { minou = new Cat({fieldBoolean: 'string'}) }).should.throw('Value for [fieldBoolean] must be a Boolean')
        });
        it('should by default throw if a Nested field have another non null type -- first level', function() {
            Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            (function() { minou = new Cat({nested: 'string'}) }).should.throw('Value for [nested] must be an Object')
        });
        it('should by default throw if a Nested field have another non null type -- second level', function() {
            Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            (function() { minou = new Cat({nested: {fieldString: 1}}) }).should.throw('Value for [nested][fieldString] must be a String')
        });
        it('should by default throw if an Array field have another non null type', function() {
            Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            (function() { minou = new Cat({arrayOfStrings: 'string'}) }).should.throw('Value for [arrayOfStrings] must be an Array')
        });


        // Testing options for fields
        it('should save String fields (schema defined with options)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String }});
            minou = new Cat({fieldString: 'Minou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
        it('should miss the String field (schema defined with options)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String }});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, undefined);
        });
        it('should use the default value -- static value', function() {
            var value = "noString1";
            Cat = thinky.createModel('Cat', { fieldString: {
                _type: String,
                default: value
            }});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should use the default function -- function', function() {
            var value = "noString2";
            Cat = thinky.createModel('Cat', { fieldString: {
                _type: String,
                default: function() { return value }
            }});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should use the default function -- with the original doc', function() {
            var value = "noString3";
            Cat = thinky.createModel('Cat', { fieldString: {
                _type: String,
                default: function(doc) { return doc.value }
            }});
            minou = new Cat({value: value});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should save Object fields (schema defined with options)', function() {
            Cat = thinky.createModel('Cat', { fieldObject: {_type: Object, schema: {fieldString: String} }});
            minou = new Cat({fieldObject: {fieldString: 'Minou'}});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldObject.fieldString, 'Minou');
        });
        it('should use the default value for Object fields (schema defined with options)', function() {
            var value = 'stringDefaultObjectOption';
            Cat = thinky.createModel('Cat', { fieldObject: {_type: Object, schema: {fieldString: String}, default: { fieldString: value} }});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldObject.fieldString, value);
        });
        it('should save Object fields (schema defined with options)', function() {
            var value = ["a", "b", "c"];
            Cat = thinky.createModel('Cat', { fieldArray: {_type: Array, schema: String }});
            minou = new Cat({fieldArray: value});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldArray.join(), value.join());
        });
        it('should use the default value for Array fields (schema defined with options)', function() {
            var value = ["a", "b", "c"];
            Cat = thinky.createModel('Cat', { fieldArray: {_type: Array, schema: String, default: value}});
            minou = new Cat({});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.fieldArray.join(), value.join());
        });


        // Testing enforce on the model level
        it('should throw when a String is missing (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [fieldString] must be defined')
        });
        it('should throw when a String is missing (defined with options) (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [fieldString] must be defined')
        });
        it('should throw when an extra field is provided (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 'hello', outOfSchema: 1}) }).should.throw('An extra field outOfSchema not defined in the schema was found.')
        });
        it('should throw when a String is missing (defined with options) (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 'hello', outOfSchema: 1}) }).should.throw('An extra field outOfSchema not defined in the schema was found.')
        });
        it('should throw when an Object is missing (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { nested: {fieldString: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [nested] must be defined')
        });
        it('should throw when an Object is missing (defined with options) (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { nested: {_type: Object, schema: {fieldString: String} }}, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [nested] must be defined')
        });
        it('should throw when an Array is missing (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { arrayField: [String] }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [arrayField] must be defined')
        });
        it('should throw when an Array is missing (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { arrayField: {_type: Array, schema: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [arrayField] must be defined')
        });
        it('should throw when a field does not have the proper type (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: {type: false, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 1}) }).should.not.throw();
        });
        it('should throw when a field is missing and the default value does not have the proper type (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String, default: 1} }, {enforce: {type: false, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.not.throw();
        });


        // Testing enforce on the schema level
        it('should throw when a String is missing (defined with options) (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String, enforce: {type: true, missing: true, extra: true}}} );
            (function() { minou = new Cat({}) }).should.throw('Value for [fieldString] must be defined')
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
