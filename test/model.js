var thinky = require('../lib/index.js');
var config = require('../config.js');
var should = require('should');
var assert = require('assert');
var r = require('rethinkdb');
var _ = require('underscore');

thinky.init({
    host: config.host,
    port: config.port,
    db: config.db
})


describe('Model', function(){
    //var Cat, catou, minou, catou_id, catouCopy, minouCopy, Dog, dogou, Human, owner;
    describe('createModel', function(){
        it('Create model', function(){
            var Cat = thinky.createModel('Cat', { catName: String });
            should.exist(Cat);
        });
        it('should create another Model', function() {
            var Cat = thinky.createModel('Cat', { catName: String });
            var Dog = thinky.createModel('Dog', { dogName: String });
            Cat.should.not.equal(Dog)
            Cat.__proto__.should.not.equal(Dog.__proto__)
        });
    });

    // Test new
    describe('new', function(){
        it('should create a new instance of the Model', function() {
            var Cat = thinky.createModel('Cat', { catName: String });
            var catou = new Cat({catName: 'Catou'});

            should(Object.prototype.toString.call(catou) === '[object Object]');
            should.equal(catou.catName, 'Catou');
        });
        it('should create another new instance of the Model', function() {
            var Cat = thinky.createModel('Cat', { catName: String });
            var minou = new Cat({catName: 'Minou'});

            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.catName, 'Minou');
        });
        it('should create documents with different settings', function() {
            var Cat = thinky.createModel('Cat', { catName: String });
            var catou = new Cat({catName: 'Catou'});
            var minou = new Cat({catName: 'Minou'});

            minou.getDocSettings().should.not.equal(catou.getDocSettings());
        });
        it('should not change the previous instances', function() {
            var Cat = thinky.createModel('Cat', { catName: String });
            var catou = new Cat({catName: 'Catou'});

            should.equal(catou.catName, 'Catou');
        });
        it('should not interfer with previously created instances of other classes', function() {
            var Cat = thinky.createModel('Cat', { catName: String });
            var Dog = thinky.createModel('Dog', { dogName: String });
            var catou = new Cat({catName: 'Catou'});
            var dogou = new Dog({dogName: "Dogou"});

            should(dogou.getModel().name, 'Dog');
            should(catou.getModel().name, 'Cat');

            catou = new Cat({catName: 'Catou'});
            should(dogou.getModel().name, 'Dog');
            should(catou.getModel().name, 'Cat');
        });
    })


    // Test schema
    describe('new', function(){
        // Testing basic types - Are they saved?
        it('should save String fields', function() {
            var Cat = thinky.createModel('Cat', { fieldString: String });
            var minou = new Cat({fieldString: 'Minou'});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
        it('should save Number fields', function() {
            var Cat = thinky.createModel('Cat', { fieldNumber: Number });
            var value = Math.random();
            var minou = new Cat({fieldNumber: value});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldNumber, value);
        });
        it('should save Boolean fields', function() {
            var Cat = thinky.createModel('Cat', { fieldBoolean: Boolean });
            var value = (Math.random > 0.5)? true: false;
            var minou = new Cat({fieldBoolean: value});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldBoolean, value);
        });
        it('should save Date fields', function() {
            var Cat = thinky.createModel('Cat', { fieldDate: Date });
            var minou = new Cat({fieldDate: new Date()});
            should(minou.fieldDate instanceof Date === true);
        });
        it('should save Date fields', function() {
            var Cat = thinky.createModel('Cat', { fieldDate: Date });
            var now = Date.now()
            var minou = new Cat({fieldDate: {
                $reql_type$: 'TIME',
                epoch_time: now,
                timezone: '+00:00'
            }});
            should.equal(minou.fieldDate.$reql_type$, 'TIME');
            should.equal(minou.fieldDate.epoch_time, now);
            should.equal(minou.fieldDate.timezone, '+00:00');
        });
        it('should save Nested fields', function() {
            var Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            var value = "Hello, I'm a nested string field"
            var minou = new Cat({ nested: { fieldString: value}});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.nested.fieldString, value);
        });
        it('should save Array fields', function() {
            var Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            var value = ["a", "b", "c"]
            var minou = new Cat({ arrayOfStrings: value });
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
        it('should save double nested fields', function() {
            var Cat = thinky.createModel('Cat', { nested: { nestedBis: {fieldString: String }}});
            var value = "Hello, I'm a nested string field"
            var minou = new Cat({ nested: { nestedBis: {fieldString: value}}});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.nested.nestedBis.fieldString, value);
        });
        it('should save Array or Array fields', function() {
            var Cat = thinky.createModel('Cat', { arrayOfStrings: [[String]] });
            var value = [["a", "b"], ["c", "d"], ["e"]];
            var minou = new Cat({ arrayOfStrings: value });
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.arrayOfStrings.join(), value.join());
        });
        it('should save Array of objects', function() {
            var Cat = thinky.createModel('Cat', { arrayOfObjects: [{ key: String}] });
            var value = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
            var minou = new Cat({ arrayOfObjects: value });
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.arrayOfObjects.length, value.length);
        });

        // Testing basic types - They should be ignored if not provided
        it('should by default ignore String fields if not provided', function() {
            var Cat = thinky.createModel('Cat', { fieldString: String });
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldString, undefined);
        });
        it('should by default ignore Number fields if not provided', function() {
            var Cat = thinky.createModel('Cat', { fieldNumber: Number });
            var value = Math.random();
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldNumber, undefined);
        });
        it('should by default ignore Boolean fields if not provided', function() {
            var Cat = thinky.createModel('Cat', { fieldBoolean: Boolean });
            var value = (Math.random > 0.5)? true: false;
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldBoolean, undefined);
        });
        it('should by default ignore Nested fields if not provided -- at nested level', function() {
            var Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            var minou = new Cat({ nested: {}});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.nested.fieldString, undefined);
        });
        it('should by default ignore Nested fields if not provided -- at first level', function() {
            var Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.nested, undefined);
        });
        it('should by default ignore Array fields if not provided', function() {
            var Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.arrayOfStrings, undefined);
        });

        // Testing basic types - An error should be thrown if the type does not match
        it('should by default throw if a String field have another non null type', function() {
            var Cat = thinky.createModel('Cat', { fieldString: String });
            (function() { minou = new Cat({fieldString: 1}) }).should.throw('Value for [fieldString] must be a String')
        });
        it('should by default throw if a Number field have another non null type', function() {
            var Cat = thinky.createModel('Cat', { fieldNumber: Number });
            var value = Math.random();
            (function() { minou = new Cat({fieldNumber: 'string'}) }).should.throw('Value for [fieldNumber] must be a Number')
        });
        it('should by default throw if a Boolean field have another non null type', function() {
            var Cat = thinky.createModel('Cat', { fieldBoolean: Boolean });
            (function() { minou = new Cat({fieldBoolean: 'string'}) }).should.throw('Value for [fieldBoolean] must be a Boolean')
        });
        it('should by default throw if a Nested field have another non null type -- first level', function() {
            var Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            (function() { minou = new Cat({nested: 'string'}) }).should.throw('Value for [nested] must be an Object')
        });
        it('should by default throw if a Nested field have another non null type -- second level', function() {
            var Cat = thinky.createModel('Cat', { nested: { fieldString: String } });
            (function() { minou = new Cat({nested: {fieldString: 1}}) }).should.throw('Value for [nested][fieldString] must be a String')
        });
        it('should by default throw if an Array field have another non null type', function() {
            Cat = thinky.createModel('Cat', { arrayOfStrings: [String] });
            (function() { minou = new Cat({arrayOfStrings: 'string'}) }).should.throw('Value for [arrayOfStrings] must be an Array')
        });


        // Testing options for fields
        it('should save String fields (schema defined with options)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: {_type: String }});
            var minou = new Cat({fieldString: 'Minou'});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldString, 'Minou');
        });
        it('should miss the String field (schema defined with options)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: {_type: String }});
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldString, undefined);
        });
        it('should use the default value -- static value', function() {
            var value = "noString1";
            var Cat = thinky.createModel('Cat', { fieldString: {
                _type: String,
                default: value
            }});
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should use the default function -- function', function() {
            var value = "noString2";
            var Cat = thinky.createModel('Cat', { fieldString: {
                _type: String,
                default: function() { return value }
            }});
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should use the default function -- with the original doc', function() {
            var Cat = thinky.createModel('Cat', { fieldString: {
                _type: String,
                default: function(doc) { return doc.value }
            }});
            var value = "noString3";
            var minou = new Cat({value: value});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldString, value);
        });
        it('should save Object fields (schema defined with options)', function() {
            var Cat = thinky.createModel('Cat', { fieldObject: {_type: Object, schema: {fieldString: String} }});
            var minou = new Cat({fieldObject: {fieldString: 'Minou'}});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldObject.fieldString, 'Minou');
        });
        it('should use the default value for Object fields (schema defined with options)', function() {
            var value = 'stringDefaultObjectOption';
            var Cat = thinky.createModel('Cat', { fieldObject: {_type: Object, schema: {fieldString: String}, default: { fieldString: value} }});
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldObject.fieldString, value);
        });
        it('should save Object fields (schema defined with options)', function() {
            var value = ["a", "b", "c"];
            var Cat = thinky.createModel('Cat', { fieldArray: {_type: Array, schema: String }});
            var minou = new Cat({fieldArray: value});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldArray.join(), value.join());
        });
        it('should use the default value for Array fields (schema defined with options)', function() {
            var value = ["a", "b", "c"];
            var Cat = thinky.createModel('Cat', { fieldArray: {_type: Array, schema: String, default: value}});
            var minou = new Cat({});
            should(Object.prototype.toString.call(minou) === '[object Object]');
            should.equal(minou.fieldArray.join(), value.join());
        });


        // Testing enforce on the model level
        it('should throw when a String is missing (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [fieldString] must be defined')
        });
        it('should throw when a String is missing (defined with options) (enforce on model level)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: {_type: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [fieldString] must be defined')
        });
        it('should throw when an extra field is provided (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 'hello', outOfSchema: 1}) }).should.throw('An extra field `[outOfSchema]` not defined in the schema was found.')
        });
        it('should throw when a String is missing (defined with options) (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: {_type: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 'hello', outOfSchema: 1}) }).should.throw('An extra field `[outOfSchema]` not defined in the schema was found.')
        });
        it('should throw when an Object is missing (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { nested: {fieldString: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [nested] must be defined')
        });
        it('should throw when an Object is missing (defined with options) (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { nested: {_type: Object, schema: {fieldString: String} }}, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [nested] must be defined')
        });
        it('should throw when an Array is missing (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { arrayField: [String] }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [arrayField] must be defined')
        });
        it('should throw when an Array is missing (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { arrayField: {_type: Array, schema: String} }, {enforce: {type: true, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.throw('Value for [arrayField] must be defined')
        });
        it('should throw when a field does not have the proper type (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: String }, {enforce: {type: false, missing: true, extra: true}});
            (function() { minou = new Cat({fieldString: 1}) }).should.not.throw();
        });
        it('should throw when a field is missing and the default value does not have the proper type (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: {_type: String, default: 1} }, {enforce: {type: false, missing: true, extra: true}});
            (function() { minou = new Cat({}) }).should.not.throw();
        });


        // Testing enforce on the schema level
        it('should throw when a String is missing (defined with options) (enforce on model leve)', function() {
            var Cat = thinky.createModel('Cat', { fieldString: {_type: String, enforce: {type: true, missing: true, extra: true}}} );
            (function() { minou = new Cat({}) }).should.throw('Value for [fieldString] must be defined')
        });
    });

    
    // Test define
    describe('define', function() {
        var Cat, Dog;
        it('-- init --', function() {
            Cat = thinky.createModel('Cat', { catName: String });
            Dog = thinky.createModel('Dog', { dogName: String });
        })
        it('should save a method', function() {
            Cat.define('hello', function() { return 'hello, my name is '+this.catName; })
            should.exist(Cat.hello)
        });
        it('should define the function for previously created documents', function(){
            var catou = new Cat({catName: 'Catou'});
            should.exist(catou.hello);
            should.equal(catou.hello(), 'hello, my name is Catou');
        });
        it('should not create a mehtod for another class', function() {
            var dogou = new Dog({dogName: "Dogou"});
            should.not.exist(dogou.hello);
        });
        it('should define the function for newly created documents', function(){
            var minou = new Cat({catName: 'Minou'});
            should.exist(minou.hello);
            should.equal(minou.hello(), 'hello, my name is Minou');
        });
        it('should throw if the user may overwrite an existing method', function(){
            var Cat = thinky.createModel('Cat', { catName: String });
            (function() { Cat.define('name', function() { return 'hello' }) }).should.throw('A property/method named `name` is already defined. Use Model.define(key, fn, true) to overwrite the function.');
        });
        it('should throw if the user may overwrite an existing method -- customed method', function(){
            var Cat = thinky.createModel('Cat', { catName: String });
            Cat.define('hello', function() { return 'hello, my name is '+this.catName; });
            (function() { Cat.define('hello', function() { return 'hello' }) }).should.throw('A property/method named `hello` is already defined. Use Model.define(key, fn, true) to overwrite the function.');
        });
        it('should throw if the user may overwrite an existing method', function(){
            var Cat = thinky.createModel('Cat', { catName: String });
            (function() { Cat.define('name', function() { return 'hello' }, true) }).should.not.throw();
        });
        it('should throw if the user may overwrite an existing method -- customed method', function(){
            var Cat = thinky.createModel('Cat', { catName: String });
            Cat.define('hello', function() { return 'hello, my name is '+this.catName; });
            (function() { Cat.define('hello', function() { return 'hello' }, true) }).should.not.throw();
        });
    });

    // Test setSchema
    describe('setSchema', function() {
        it('should change the schema', function() {
            var Cat = thinky.createModel('Cat', { catName: String, age: Number });
            Cat.setSchema({ catName: String, owner: String })
            var catou = new Cat({ catName: 'Catou', owner: 'Michel', age: 7});
            should.equal(catou.catName, 'Catou');
            should.equal(catou.owner, 'Michel');
            should.equal(catou.age, undefined);
        });
    });

    // Test getPrimaryKey
    describe('getPrimaryKey', function() {
        it('should return the primary key -- default primary key', function() {
            var Cat = thinky.createModel('Cat', { catName: String });
            should.equal(Cat.getPrimaryKey(), 'id');
        });
        it('should return the primary key', function() {
            var Cat = thinky.createModel('Cat -- customed primary key', { catName: String }, {primaryKey: 'test'});
            should.equal(Cat.getPrimaryKey(), 'test');
        });

    });

    // Test against a database
    describe('save', function() {
        // Init with some data
        it('should add a field id -- Testing model', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            catou = new Cat({name: 'Catou'});
            catou.save(null, function(error, result) {
                should.exist(result.id);
                var minou = new Cat({name: 'Minou'});
                minou.save(null, function(error, result) {
                    minouCopy = result;
                    done();
                });
            });
        });
    });

    describe('get', function() {
        var Cat;
        var scope = {}
        it('-- init --', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            catou.save(null, function(error, result) {
                scope.catou = result;
                should.exist(result.id);

                var minou = new Cat({name: 'Minou'});
                minou.save(null, function(error, result) {
                    scope.minou = result;
                    done();
                });
            });
        });
        it('should retrieve a document in the database', function(done){
            Cat.get(scope.catou.id, function(error, result) {
                should(_.isEqual(result, scope.catou));
                done();
            })
        });
        it('should retrieve documents in the database', function(done){
            Cat.get([scope.catou.id, scope.minou.id], function(error, result) {
                should.not.exists(error);
                result.should.have.length(2);
                should((result[0].id === scope.catou.id) || (result[0].id === scope.minou.id));
                done();
            })
        });
        //TODO Move this test elsewhere // just testing chaining for now
        it('with limit should work', function(done){
            Cat.get([scope.catou.id, scope.minou.id]).skip(1).limit(1, function(error, result) {
                should.not.exists(error);
                result.should.have.length(1);
                should((result[0].id === scope.catou.id) || (result[0].id === scope.minou.id));
                done();
            })

        });
        it('should work with manually calling run', function(done){
            Cat.get([scope.catou.id, scope.minou.id]).skip(1).limit(1).run(function(error, result) {
                should.not.exists(error);
                result.should.have.length(1);
                should((result[0].id === scope.catou.id) || (result[0].id === scope.minou.id));
                done();
            })
        });
        it('should return null if document does not exist', function(done){
            Cat.get('FAKE_ID', function(error, result){
                should.not.exist(error);
                should.not.exist(result);
                done();
            });
        });
    });
    describe('getAll', function() {
        it('should retrieve some documents in the database -- single values', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            catou.save(null, function(error, result) {
                Cat.getAll(catou.name, {index: 'name'}, function(error, result) {
                    if (error) throw error;
                    should.not.exist(error);
                    should(result.length >= 1);
                    done();
                })
            });
        });
        it('should retrieve some documents in the database -- multiple values', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            catou.save(null, function(error, result) {
                if (error) throw error;

                var minou = new Cat({name: 'Minou'});
                minou.save(null, function(error, result) {
                    if (error) throw error;
                    Cat.getAll([catou.name, minou.name], {index: 'name'}, function(error, result) {
                        should.not.exists(error);
                        should(result.length >= 2);
                        done();
                    });

                });
            });
        });
        it('should work with hasMany joins', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var Task = thinky.createModel('Task', {id: String, catId: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'id', rightKey: 'catId'});

            var catou = new Cat({name: "Catou"});
            var task1 = new Task({task: "Catch the red dot"});
            var task2 = new Task({task: "Eat"});
            var task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, firstResult) {
                Cat.getAll([catou.id], {index: 'id'}).getJoin().run(function(error, result) {
                    result.should.have.length(1);
                    result[0].tasks.should.have.length(3);
                    should.exist(result[0].tasks[0].id);
                    should.exist(result[0].tasks[1].id);
                    should.exist(result[0].tasks[2].id);
                    done();
                })
            })
        });
    });

    describe('execute', function() {
        it('should be able to execute arbitrary queries', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String });
            Cat.execute( r.db(config.db).table('Cat').limit(1), function(error, result) {
                should.not.exists(error);
                result.should.have.length(1);
                done();
            })
        })
    })

    describe('pluck', function() {
        var Cat;
        var scope = {}
        it('should pluck multiple fields', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String, privateField: String });
            var catou = new Cat({name: 'Catou', privateField: 'Pshiiii'});
            catou.save( function(error, result) {
                if (error) throw error;
                Cat.get(catou.id).pluck(['id', 'name'], function(err, result) {
                    should.exist(result);
                    should.not.exist(result.privateField);
                    done();
                });
            })
        });
        it('should pluck a single field', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String, privateField: String });
            var catou = new Cat({name: 'Catou', privateField: 'Pshiiii'});
            catou.save( function(error, result) {
                if (error) throw error;
                Cat.get(catou.id).pluck('id', function(err, result) {
                    should.exist(result);
                    should.not.exist(result.privateField);
                    should(!result.hasOwnProperty('name'));
                    done();
                });
            })
        });
    });

    describe('without', function() {
        var Cat;
        var scope = {}
        it('should remove a field', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String, privateField: String });
            var catou = new Cat({name: 'Catou', privateField: 'Pshiiii'});
            catou.save( function(error, result) {
                if (error) throw error;
                Cat.get(catou.id).without('privateField', function(err, result) {
                    should.exist(result);
                    should.not.exist(result.privateField);
                    done();
                });
            })
        });
        it('should remove a field -- passing an array', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String, privateField: String });
            var catou = new Cat({name: 'Catou', privateField: 'Pshiiii'});
            catou.save( function(error, result) {
                if (error) throw error;
                Cat.get(catou.id).without(['privateField'], function(err, result) {
                    should.exist(result);
                    should.not.exist(result.privateField);
                    done();
                });
            })
        });
    });


    describe('filter', function() {
        var Cat;
        var scope = {}
        it('-- init --', function(done){
            Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            catou.save(null, function(error, result) {
                scope.catou = result;
                should.exist(result.id);

                var minou = new Cat({name: 'Minou'});
                minou.save(null, function(error, result) {
                    scope.minou = result;
                    done();
                });
            });
        });
        it('retrieve documents in the database', function(done){
            Cat.filter(function(doc) { return r.expr([scope.catou.id, scope.minou.id]).contains(doc("id")) },
                function(error, result) {
                    should.not.exists(error);
                    result.should.have.length(2);
                    done();
                }
            )
        });
        it('should return many documents', function(done){
            Cat.filter(function(doc) { return true },
                function(error, result) {
                    should.not.exists(error);
                    should(result.length > 2);
                    done();
                }
            )
        });
        it('should work with a hasMany relation', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var Task = thinky.createModel('Task', {id: String, catId: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'id', rightKey: 'catId'});

            var catou = new Cat({name: "Catou"});
            var task1 = new Task({task: "Catch the red dot"});
            var task2 = new Task({task: "Eat"});
            var task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, firstResult) {
                Cat.filter(function(doc) { return doc("id").eq(catou.id) }).getJoin().run(function(error, result) {
                    result.should.have.length(1);
                    result[0].tasks.should.have.length(3);
                    should.exist(result[0].tasks[0].id);
                    should.exist(result[0].tasks[1].id);
                    should.exist(result[0].tasks[2].id);
                    catou.tasks.should.have.length(3);
                    done();
                })
            })
        });

    });

    describe('count', function() {
        it('should return the number of document in the table', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
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


    // Testing events
    describe('on', function() {
        it('should add a listener on the model', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            Cat.on('test', function() { });
            should.exists(Cat.listeners('test'));
            Cat.listeners('test').should.have.length(1);
        });
        it('should add a listener on the model -- and emit should trigger it', function(done) {
            var Cat = thinky.createModel('Cat', {name: String});
            Cat.on('haha', function() {
                done();
            });
            var catou = new Cat({name: 'Catou'});
            catou.emit('haha');
        });
        it('should not pollute other/new models', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            should.not.exist(Cat.getModel()._listeners['test']);
        });
        it('should be able to add more than one listener', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            Cat.on('test', function() {});
            Cat.on('test', function() {});
            Cat.getModel()._listeners['test'].should.have.length(2);
        });
    });

    describe('off', function() {
        it('should remove one listener if the event and listener are provided', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            var fn = function() {};
            Cat.on('test', function() { });
            Cat.on('test', fn);
            Cat.on('test2', function() {});
            Cat.off('test', fn);
            should.exists(Cat.getModel()._listeners['test']);
            Cat.getModel()._listeners['test'].should.have.length(1);
        });
        it('should remove all the listeners of an event if only the event is provided', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            var fn = function() {};
            Cat.on('test', function() { });
            Cat.on('test', fn);
            Cat.on('test2', function() {});
            Cat.off('test');
            should.not.exists(Cat.getModel()._listeners['test'])
        });
        it('should remove all the listeners that match the one provided if only the listener is provided', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            var fn = function() {};
            Cat.on('test', function() { });
            Cat.on('test', fn);
            Cat.on('test2', fn);
            Cat.off(fn);
            Cat.getModel()._listeners['test'].should.have.length(1);
            Cat.getModel()._listeners['test2'].should.have.length(0);
        });
        it('should remove everything if no argument is provided', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            var fn = function() {};
            Cat.on('test', fn);
            Cat.on('test', fn);
            Cat.on('test2', fn);
            Cat.off();
            should.not.exists(Cat.getModel()._listeners['test'])
            should.not.exists(Cat.getModel()._listeners['test2'])
        });
    });

    describe('listeners', function() {
         it('should return the listeners for the event', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            var fn = function() {};
            Cat.on('test', fn);
            Cat.on('test', fn);
            Cat.on('test2', fn);
            Cat.listeners('test').should.have.length(2);
            Cat.listeners('test2').should.have.length(1);
        });
    });

    describe('once', function() {
         it('should be triggered once then remove', function() {
            var Cat = thinky.createModel('Cat', {name: String});
            var fn = function() {};
            Cat.on('test', fn);
            Cat.once('test', fn);
            Cat.once('test2', fn);

            catou = new Cat({name: 'Catou'});
            catou.emit('test');
            catou.emit('test2');

            catou.listeners('test').should.have.length(1);
            catou.listeners('test2').should.have.length(0);
        });
       
    });

    // Test joins
    describe('hasOne', function() {
        var Cat, Human, Mother;
        it('should add a new key in model.joins', function() {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});
            should.exist(Cat.getModel().joins['owner']);
        });
        it('get should be able to get joined documents', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String, idMom: String});
            var Mother = thinky.createModel('Mother', {id: String, motherName: String});
            Human.hasOne(Mother, 'mom', {leftKey: 'idMom', rightKey: 'id'});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            var mother = new Mother({motherName: "Mom"});
            catou['owner'] = owner;
            owner['mom'] = mother;

            catou.save( {saveJoin: true}, function(error, firstResult) {
                Cat.get(catou.id).getJoin().run(function(error, result) {
                    should.not.exist(error);
                    should.exist(result.id);
                    should.exist(result.idHuman);
                    should.exist(result.owner.id);
                    should.exist(result.owner.idMom);
                    should.exist(result.owner.mom.id);
                    done();
                })
            });
        });
        it('get should be able to get joined documents -- and they should be `saved`', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String, idMom: String});
            var Mother = thinky.createModel('Mother', {id: String, motherName: String});
            Human.hasOne(Mother, 'mom', {leftKey: 'idMom', rightKey: 'id'});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            var mother = new Mother({motherName: "Mom"});
            catou['owner'] = owner;
            owner['mom'] = mother;

            catou.save( {saveJoin: true}, function(error, firstResult) {
                Cat.get(catou.id).getJoin().run(function(error, result) {
                    should.equal(result.getDocument().docSettings.saved, true)
                    should.equal(result.owner.getDocument().docSettings.saved, true)
                    should.equal(result.owner.mom.getDocument().docSettings.saved, true)
                    done();
                })
            })
        });

        it('getAll should work -- nested joins', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String, idMom: String});
            var Mother = thinky.createModel('Mother', {id: String, motherName: String});
            Human.hasOne(Mother, 'mom', {leftKey: 'idMom', rightKey: 'id'});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            var mother = new Mother({motherName: "Mom"});
            catou['owner'] = owner;
            owner['mom'] = mother;

            catou.save({saveJoin: true}, function(error, result) {
                should.exist(catou.id);
                should.exist(catou.idHuman);
                should.exist(catou.owner.id);

                var owner1 = new Human({ownerName: "Michel1"});
                var catou1 = new Cat({name: "Catou1"});
                var mother1 = new Mother({motherName: "Mom1"});
                catou1['owner'] = owner1;
                owner1['mom'] = mother1;

                catou1.save({saveJoin: true}, function(error, result) {
                    Cat.getAll([catou.id, catou1.id], {index: 'id'})
                        .getJoin(function(error, result) {
                            result.should.have.length(2);

                            should.exist(result[0].id);
                            should.exist(result[0].idHuman);
                            should.exist(result[0].owner.id);
                            should.exist(result[0].owner.idMom);
                            should.exist(result[0].owner.mom.id);

                            should.exist(result[1].id);
                            should.exist(result[1].idHuman);
                            should.exist(result[1].owner.id);
                            should.exist(result[1].owner.idMom);
                            should.exist(result[1].owner.mom.id);

                            done();

                    })
                })

            });
        });
        it('filter should work -- nested joins', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String, idMom: String});
            var Mother = thinky.createModel('Mother', {id: String, motherName: String});
            Human.hasOne(Mother, 'mom', {leftKey: 'idMom', rightKey: 'id'});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            var mother = new Mother({motherName: "Mom"});
            catou['owner'] = owner;
            owner['mom'] = mother;

            catou.save({saveJoin: true}, function(error, result) {
                should.exist(catou.id);
                should.exist(catou.idHuman);
                should.exist(catou.owner.id);

                var owner1 = new Human({ownerName: "Michel1"});
                var catou1 = new Cat({name: "Catou1"});
                var mother1 = new Mother({motherName: "Mom1"});
                catou1['owner'] = owner1;
                owner1['mom'] = mother1;

                catou1.save({saveJoin: true}, function(error, result) {
                    Cat.filter(function(doc) { return r.expr([catou.id, catou1.id]).contains(doc("id")) })
                        .getJoin().run(
                        function(error, result) {
                            result.should.have.length(2);

                            should.exist(result[0].id);
                            should.exist(result[0].idHuman);
                            should.exist(result[0].owner.id);
                            should.exist(result[0].owner.idMom);
                            should.exist(result[0].owner.mom.id);

                            should.exist(result[1].id);
                            should.exist(result[1].idHuman);
                            should.exist(result[1].owner.id);
                            should.exist(result[1].owner.idMom);
                            should.exist(result[1].owner.mom.id);

                            done();
                        }
                    )
                })

            });
        });
    })

    describe('hasMany', function() {
        var Cat, catou, Task, task1, task2, task3;
        it('should add a new key in model.joins', function() {
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var Task = thinky.createModel('Task', {id: String, catId: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'id', rightKey: 'catId'});

            should.exist(Cat.getModel().joins['tasks']);
            should(Cat.getModel().joins['tasks'].type, 'hasMany');
            should(Cat.getModel().joins['tasks'].model, Task);
            should(Cat.getModel().joins['tasks'].joinClause.leftKey, 'taskIds');
            should(Cat.getModel().joins['tasks'].joinClause.rightKey, 'id');
        });

        it('get should be able to get joined documents', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var Task = thinky.createModel('Task', {id: String, catId: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'id', rightKey: 'catId'});

            catou = new Cat({name: "Catou"});
            task1 = new Task({task: "Catch the red dot"});
            task2 = new Task({task: "Eat"});
            task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, firstResult) {
                if (error) throw error;

                Cat.get(catou.id).getJoin().run(function(error, result) {
                    result.tasks.should.have.length(3);
                    should.exist(result.tasks[0].id);
                    should.exist(result.tasks[1].id);
                    should.exist(result.tasks[2].id);
                    catou.tasks.should.have.length(3);
                    done();
                })
            });

        });
        it('get should be able to get joined documents -- and they should be `saved`', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var Task = thinky.createModel('Task', {id: String, catId: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'id', rightKey: 'catId'});

            catou = new Cat({name: "Catou"});
            task1 = new Task({task: "Catch the red dot"});
            task2 = new Task({task: "Eat"});
            task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, firstResult) {
                if (error) throw error;

                Cat.get(catou.id).getJoin().run(function(error, result) {
                    should(result.tasks[0].getDocument().docSettings.saved, true);
                    should(result.tasks[1].getDocument().docSettings.saved, true);
                    should(result.tasks[2].getDocument().docSettings.saved, true);
                    done();
                })
            })
        });
        it('should work with orderBy', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var Task = thinky.createModel('Task', {id: String, catId: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'id', rightKey: 'catId'}, {orderBy: 'id'});

            catou = new Cat({name: "Catou"});
            task1 = new Task({task: "Catch the red dot"});
            task2 = new Task({task: "Eat"});
            task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, firstResult) {
                if (error) throw error;

                Cat.get(catou.id).getJoin().run(function(error, result) {
                    should(result.tasks[0].id < result.tasks[1].id);
                    should(result.tasks[1].id < result.tasks[2].id);
                    done();
                })
            })
        });
        it('should work with orderBy -- desc', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var Task = thinky.createModel('Task', {id: String, catId: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'id', rightKey: 'catId'}, {orderBy: '-id'});

            catou = new Cat({name: "Catou"});
            task1 = new Task({task: "Catch the red dot"});
            task2 = new Task({task: "Eat"});
            task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, firstResult) {
                if (error) throw error;

                Cat.get(catou.id).getJoin().run(function(error, result) {
                    should(result.tasks[0].id > result.tasks[1].id);
                    should(result.tasks[1].id > result.tasks[2].id);
                    done();
                })
            })
        });
        it('should work for n-n relations', function(done) {
            console.log('')
            console.log('')
            console.log('---------------------')
            console.log('')
            console.log('')
            var Cat = thinky.createModel('Cat', {id: String, name: String});
            var CatTaskLink = thinky.createModel('CatTaskLink', {id: String, catId: String, taskId: String})
            var Task = thinky.createModel('Task', {id: String, task: String});

            Cat.hasMany(CatTaskLink, 'tasks', {leftKey: 'id', rightKey: 'catId'});
            CatTaskLink.hasOne(Task, 'task', {leftKey: 'taskId', rightKey: 'id'});

            var catou = new Cat({name: "Catou"});
            
            var link1 = new CatTaskLink({});
            var link2 = new CatTaskLink({});
            var link3 = new CatTaskLink({});

            catou.tasks = [link1, link2, link3];

            var task1 = new Task({task: "Catch the red dot"});
            var task2 = new Task({task: "Eat"});
            var task3 = new Task({task: "Sleep"});

            link1.task = task1;
            link2.task = task2;
            link3.task = task3;


            catou.save({saveJoin: true}, function(error, result) {
                if (error) throw error;

                should.exist(result.id);
                result.tasks.should.have.length(3);
                should.exist(result.tasks[0].id);
                should.exist(result.tasks[1].id);
                should.exist(result.tasks[2].id);
                should.exist(result.tasks[0].task.id);
                should.exist(result.tasks[1].task.id);
                should.exist(result.tasks[2].task.id);

                Cat.get(catou.id).getJoin().run(function(error, result) {
                    done()
                })
            })

        })
    })
})

