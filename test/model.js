var thinky = require('../lib/index.js');
var should = require('should');
var assert = require('assert');
var r = require('rethinkdb');
var _ = require('underscore');

thinky.init({})

describe('Model', function(){
    var Cat, catou, minou, catou_id, catouCopy, minouCopy, Dog, dogou;
    describe('createModel', function(){
        it('Create model', function(){
            Cat = thinky.createModel('Cat', { catName: String });
            should.exist(Cat);
        });
        it('should create another Model', function() {
            Dog = thinky.createModel('Dog', { dogName: String });
            Cat.should.not.equal(Dog)
            Cat.__proto__.should.not.equal(Dog.__proto__)
        });
    });

    // Test new
    describe('new', function(){
        it('should create a new instance of the Model', function() {
            catou = new Cat({catName: 'Catou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(catou.catName, 'Catou');
        });
        it('should create another new instance of the Model', function() {
            minou = new Cat({catName: 'Minou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(minou.catName, 'Minou');
        });
        it('should not change the previous instances', function() {
            catou = new Cat({catName: 'Catou'});
            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(catou.catName, 'Catou');
        });
        it('should not interfer with previously created instances of other classes', function() {
            dogou = new Dog({dogName: "Dogou"});
            should(dogou.getModel().name, 'Dog');
            should(catou.getModel().name, 'Cat');
        });
    })


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
        it('should throw when a String is missing (defined with options) (enforce on model level)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [fieldString] must be defined')
        });
        it('should throw when an extra field is provided (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 'hello', outOfSchema: 1}) }).should.throw('An extra field `outOfSchema` not defined in the schema was found.')
        });
        it('should throw when a String is missing (defined with options) (enforce on model leve)', function() {
            Cat = thinky.createModel('Cat', { fieldString: {_type: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 'hello', outOfSchema: 1}) }).should.throw('An extra field `outOfSchema` not defined in the schema was found.')
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
            Cat = thinky.createModel('Cat', { catName: String });
            Cat.define('hello', function() { return 'hello, my name is '+this.catName; })
            should.exist(Cat.hello)
        });
        it('should define the function for previously created documents', function(){
            catou = new Cat({catName: 'Catou'});
            should.exist(catou.hello);
            should.equal(catou.hello(), 'hello, my name is Catou');
        });
        it('should not create a mehtod for another class', function() {
            Dog = thinky.createModel('Dog', { dogName: String });
            dogou = new Dog({dogName: "Dogou"});
            should.not.exist(dogou.hello);
        });
        it('should define the function for newly created documents', function(){
            minou = new Cat({catName: 'Minou'});
            should.exist(minou.hello);
            should.equal(minou.hello(), 'hello, my name is Minou');
        });
        it('should throw if the user may overwrite an existing method', function(){
            Cat = thinky.createModel('Cat', { catName: String });
            (function() { Cat.define('name', function() { return 'hello' }) }).should.throw('A property/method named `name` is already defined. Use Model.define(key, fn, true) to overwrite the function.');
        });
        it('should throw if the user may overwrite an existing method -- customed method', function(){
            Cat = thinky.createModel('Cat', { catName: String });
            Cat.define('hello', function() { return 'hello, my name is '+this.catName; });
            (function() { Cat.define('hello', function() { return 'hello' }) }).should.throw('A property/method named `hello` is already defined. Use Model.define(key, fn, true) to overwrite the function.');
        });
        it('should throw if the user may overwrite an existing method', function(){
            Cat = thinky.createModel('Cat', { catName: String });
            (function() { Cat.define('name', function() { return 'hello' }, true) }).should.not.throw();
        });
        it('should throw if the user may overwrite an existing method -- customed method', function(){
            Cat = thinky.createModel('Cat', { catName: String });
            Cat.define('hello', function() { return 'hello, my name is '+this.catName; });
            (function() { Cat.define('hello', function() { return 'hello' }, true) }).should.not.throw();
        });
    });

    // Test setSchema
    describe('setSchema', function() {
        it('should change the schema', function() {
            Cat = thinky.createModel('Cat', { catName: String, age: Number });
            Cat.setSchema({ catName: String, owner: String })
            catou = new Cat({ catName: 'Catou', owner: 'Michel', age: 7});
            should.equal(catou.catName, 'Catou');
            should.equal(catou.owner, 'Michel');
            should.equal(catou.age, undefined);
        });
    });

    // Test getPrimaryKey
    describe('getPrimaryKey', function() {
        it('should return the primary key -- default primary key', function() {
            Cat = thinky.createModel('Cat', { catName: String });
            should.equal(Cat.getPrimaryKey(), 'id');
        });
        it('should return the primary key', function() {
            Cat = thinky.createModel('Cat -- customed primary key', { catName: String }, {primaryKey: 'test'});
            should.equal(Cat.getPrimaryKey(), 'test');
        });

    });

    // Test against a database
    describe('save', function() {
        // Init with some data
        it('should add a field id -- Testing model', function(done){
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
        it('should retrieve a document in the database', function(done){
            Cat.get(catouCopy.id, function(error, result) {
                should(_.isEqual(result, catouCopy));
                done();
            })
        });
        it('should retrieve documents in the database', function(done){
            Cat.get([catouCopy.id, minouCopy.id], function(error, result) {
                should.not.exists(error);
                result.should.have.length(2);
                should((result[0].id === catouCopy.id) || (result[0].id === minouCopy.id));
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
