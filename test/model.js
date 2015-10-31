var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;
var type = thinky.type;
var Errors = thinky.Errors;

var util = require(__dirname+'/util.js');
var assert = require('assert');
var Promise = require('bluebird');

var modelNameSet = {};
modelNameSet[util.s8()] = true;
modelNameSet[util.s8()] = true;
var modelNames = Object.keys(modelNameSet);

var cleanTables = function(done) {
  var promises = [];
  var name;
  for(var name in modelNameSet) {
    promises.push(r.table(name).delete().run());
  }
  Promise.settle(promises).error(function () {/*ignore*/}).finally(function() {
    // Add the links table
    for(var model in thinky.models) {
      modelNameSet[model] = true;
    }
    modelNames = Object.keys(modelNameSet);
    thinky._clean();
    done();
  });
}

describe('createModel', function(){
  afterEach(cleanTables);

  var model;
  it('Create a new model', function(){
    model = thinky.createModel(modelNames[0], {id: String, name: String})
    assert(model);
  });
  it('Check if the table was created', function(done){
    model.once("ready", function() {
      r.tableList().run().then(function(result) {
        assert.notEqual(result.indexOf(modelNames[0]), -1)
        done();
      }).error(done)
    });
  });
  it('Create multiple models', function(done) {
    var model1 = thinky.createModel(modelNames[0], {id: String, name: String})

    var model2 = thinky.createModel(modelNames[1], {id: String, name: String})

    assert(model1 !== model2);
    model2.once('ready', function() {
      // TODO Remove when tableWait is implemented on the server
      // Make sure that modelNames[1] is ready for the next tests
      // (since we do not recreate the tables)
      done();
    });
  });
  it('Check if the table was created', function(done){
    model = thinky.createModel("nonExistingTable", {id: String, name: String}, {init: false})
    model.get(1).run().then(function() { done(new Error("Expecting error")) }).error(function(e) {
      assert(e.message.match(/^Table `.*` does not exist in/));
      done();
    });
  });

});
describe('[_]getModel', function(){
  afterEach(cleanTables);

  it('_getModel', function(){
    var name = util.s8();
    var model = thinky.createModel(modelNames[0], {id: String, name: String}, {init: false})
    assert(model._getModel().hasOwnProperty('_name'));
  });
  it('getTableName', function(){
    var name = util.s8();
    var model = thinky.createModel(modelNames[0], {id: String, name: String}, {init: false})
    assert(model.__proto__.__proto__.hasOwnProperty('getTableName'));
    assert.equal(model.getTableName(), modelNames[0]);
  });

});
describe('Model', function() {
  after(cleanTables);

  var name = util.s8();

  var Model;
  it('Create a new instance of the Model', function() {
    Model = thinky.createModel(modelNames[0], { str: String });
    var str = util.s8();
    var doc = new Model({str: str});

    assert(util.isPlainObject(doc));
    assert.equal(doc.str, str);
  });
  it('Create multiple instances from the same document', function() {
    var str = util.s8();
    var num = util.random();

    var values = {str: str, num: num};
    var doc = new Model(values);
    var otherDoc = new Model(values);

    assert.strictEqual(doc, values);
    assert.notStrictEqual(doc, otherDoc);
    doc.str = doc.str+util.s8();
    assert.notEqual(doc.str, otherDoc.str);

    var anotherDoc = new Model(values);
    assert.notStrictEqual(anotherDoc, otherDoc);
    assert.notStrictEqual(anotherDoc, doc);
  });
  it('Create two instances with the same argument of the Model', function() {
    var str = util.s8();
    var docValues = {str: str};
    var doc1 = new Model(docValues);
    var doc2 = new Model(docValues);

    assert.notStrictEqual(doc1, doc2);
  });

  it('Two instances should be different', function() {
    var str1 = util.s8();
    var str2 = util.s8();
    var doc1 = new Model({str: str1});
    assert.equal(doc1.str, str1);

    var doc2 = new Model({str: str2});
    assert.equal(doc2.str, str2);

    assert.equal(doc1.str, str1);
    assert.notEqual(doc1, doc2);
  });
  it('Two instances should have different prototypes', function() {
    var str1 = util.s8();
    var str2 = util.s8();
    var doc1 = new Model({str: str1});
    var doc2 = new Model({str: str2});

    assert.notEqual(doc1.__proto__, doc2.__proto__);
  });
  it('Two instances should have the same model', function() {
    var str1 = util.s8();
    var str2 = util.s8();
    var doc1 = new Model({str: str1});
    var doc2 = new Model({str: str2});

    assert.equal(doc1.getModel(), doc2.getModel());
  });

  it('Docs from different models should not interfer', function() {
    var str = util.s8();
    var doc = new Model({str: str});

    var otherName = util.s8();
    var OtherModel = thinky.createModel(modelNames[1], { str: String });

    var otherStr = util.s8();
    var otherDoc = new OtherModel({str: otherStr});

    assert.equal(doc.str, str);
    assert.equal(otherDoc.str, otherStr);

    assert.notEqual(otherDoc.getModel(), doc.getModel());
    assert.equal(doc.getModel().getTableName(), modelNames[0]);
    assert.equal(otherDoc.getModel().getTableName(), modelNames[1]);
  });
});

describe("Batch insert", function() {
  afterEach(cleanTables);

  it('insert should work with a single doc', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    Model.save({id: "foo"}).then(function(result) {
      assert.deepEqual(result, {id: "foo"});
      done();
    }).error(function(e) {
      done(e);
    });
  });
  it('Batch insert should work', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    var docs = [];
    for(var i=0; i<10; i++) {
      docs.push({num: i})
    }
    Model.save(docs).then(function(result) {
      assert.strictEqual(result, docs);
      for(i=0; i<10; i++) {
        assert.equal(typeof docs[i].id, 'string');
        assert(docs[i].isSaved());
      }
      done();
    }).error(function(e) {
      done(e);
    });
  });
  it('Batch insert should validate fields before saving', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    Model.save([{id: 4}]).error(function(err) {
      assert.equal(err.message, "One of the documents is not valid. Original error:\nValue for [id] must be a string or null.");
      assert(err instanceof Errors.ValidationError);
      done();
    });
  });

  it('Batch insert should properly error is __one__ insert fails', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    Model.save([{id: '4'}]).then(function(result) {
      assert.equal(result[0].id, 4);
      var docs = [];
      for(var i=0; i<10; i++) {
        docs.push({num: i, id: ""+i})
      }
      Model.save(docs).then(function() {
        done(new Error("Was expecting an error"));
      }).error(function(e) {
        assert(e.message.match(/An error occurred during the batch insert/));
        done();
      });
    });
  });
  it('Should generate savable copies', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      location: type.point()
    });
    Model.save({id: "foo", location: [1,2]}).then(function(result) {
      assert.equal(result.id, "foo");
      assert.equal(result.location.$reql_type$, "GEOMETRY");
      done();
    }).error(function(e) {
      done(e);
    });
  });
  it('Model.save should handle options - update', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    Model.save({id: "foo"}).then(function(result) {
      assert.equal(result.id, "foo");
      return Model.save({id: "foo", bar: "buzz"}, {conflict: 'update'});
    }).then(function(result) {
      assert.deepEqual(result, {id: "foo", bar: "buzz"});
      done();
    }).error(function(e) {
      done(e);
    });
  });
  it('Model.save should handle options - replace', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    Model.save({id: "foo", bar: "buzz"}).then(function(result) {
      assert.equal(result.id, "foo");
      return Model.save({id: "foo"}, {conflict: 'replace'});
    }).then(function(result) {
      assert.deepEqual(result, {id: "foo"});
      done();
    }).error(function(e) {
      done(e);
    });
  });


});

describe("Joins", function() {
  afterEach(cleanTables);

  it('hasOne should save the join', function() {
    var model = thinky.createModel(modelNames[0], { id: String});

    var otherModel = thinky.createModel(modelNames[1], { id: String, otherId: String });

    model.hasOne(otherModel, "otherDoc", "id", "otherId");
    assert(model._getModel()._joins["otherDoc"])
  });
  it('hasOne should throw if it uses a field already used by another relation', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    var otherModel = thinky.createModel(modelNames[1], { id: String, otherId: String }, {init: false});

    var anotherModel = thinky.createModel(modelNames[2], { id: String, otherId: String }, {init: false});


    model.hasOne(otherModel, "otherDoc", "id", "otherId", {init: false});
    try{
      model.hasOne(anotherModel, "otherDoc", "id", "otherId");
    }
    catch(err) {
      assert.equal(err.message, "The field `otherDoc` is already used by another relation.")
      done();
    }
  });
  it('belongsTo should throw if it uses a field already used by another relation', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    var otherModel = thinky.createModel(modelNames[1], { id: String, otherId: String }, {init: false});

    var anotherModel = thinky.createModel(modelNames[2], { id: String, otherId: String }, {init: false});


    model.belongsTo(otherModel, "otherDoc", "id", "otherId", {init: false});
    try{
      model.belongsTo(anotherModel, "otherDoc", "id", "otherId");
    }
    catch(err) {
      assert.equal(err.message, "The field `otherDoc` is already used by another relation.")
      done();
    }
  });
  it('hasMany should throw if it uses a field already used by another relation', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    var otherModel = thinky.createModel(modelNames[1], { id: String, otherId: String }, {init: false});

    var anotherModel = thinky.createModel(modelNames[2], { id: String, otherId: String }, {init: false});


    model.hasMany(otherModel, "otherDoc", "id", "otherId", {init: false});
    try{
      model.hasMany(anotherModel, "otherDoc", "id", "otherId");
    }
    catch(err) {
      assert.equal(err.message, "The field `otherDoc` is already used by another relation.")
      done();
    }
  });
  it('hasAndBelongsToMany should throw if it uses a field already used by another relation', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    var otherModel = thinky.createModel(modelNames[1], { id: String, otherId: String }, {init: false});

    var anotherModel = thinky.createModel(modelNames[2], { id: String, otherId: String }, {init: false});


    model.hasAndBelongsToMany(otherModel, "otherDoc", "id", "otherId", {init: false});
    try{
      model.hasAndBelongsToMany(anotherModel, "otherDoc", "id", "otherId");
    }
    catch(err) {
      assert.equal(err.message, "The field `otherDoc` is already used by another relation.")
      // Wait for the link table to be ready since we wont' drop/recreate the table
      thinky.models[model._getModel()._joins["otherDoc"].link].once('ready', function() {
        // TODO Remove when tableWait is implemented on the server
        done();
      })
    }
  });
  it('hasOne should throw if the first argument is not a model', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    try{
      model.hasOne(function() {}, "otherDoc", "otherId", "id");
    }
    catch(err) {
      assert.equal(err.message, "First argument of `hasOne` must be a Model");
      done();
    }
  });
  it('belongsTo should throw if the first argument is not a model', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    try{
      model.belongsTo(function() {}, "otherDoc", "otherId", "id");
    }
    catch(err) {
      assert.equal(err.message, "First argument of `belongsTo` must be a Model");
      done();
    }
  });
  it('hasMany should throw if the first argument is not a model', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    try{
      model.hasMany(function() {}, "otherDoc", "otherId", "id");
    }
    catch(err) {
      assert.equal(err.message, "First argument of `hasMany` must be a Model");
      done();
    }
  });
  it('hasAndBelongsToMany should throw if the first argument is not a model', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String}, {init: false});

    try{
      model.hasAndBelongsToMany(function() {}, "otherDoc", "otherId", "id");
    }
    catch(err) {
      assert.equal(err.message, "First argument of `hasAndBelongsToMany` must be a Model");
      done();
    }
  });
  it('hasOne should create an index on the other model', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String, foreignKeyName: String });

    var foreignKey = util.s8();

    var schema = {id: String};
    schema[foreignKey] = String;
    var otherModel = thinky.createModel(modelNames[1], schema);

    model.hasOne(otherModel, "otherDoc", "modelId", foreignKey);

    otherModel.once("ready", function() {
      r.table(otherModel.getTableName()).indexList().run().then(function(result) {
        r.table(otherModel.getTableName()).indexWait(foreignKey).run().then(function() {
          done();
        }).error(done);
      }).error(done);
    })
  });
  it('BelongsTo should create an index on the other model', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String, otherId: String });

    var foreignKey = util.s8();

    var schema = {id: String};
    schema[foreignKey] = String;
    var otherModel = thinky.createModel(modelNames[1], schema);

    model.belongsTo(otherModel, "otherDoc", foreignKey, "otherId");

    otherModel.once("ready", function() {
      r.table(otherModel.getTableName()).indexList().run().then(function(result) {
        r.table(otherModel.getTableName()).indexWait('otherId').run().then(function() {
          done();
        }).error(done);
      }).error(done);
    })
  });
  it('hasMany should create an index on the other model', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String });

    var foreignKey = util.s8();

    var otherName = util.s8();
    var schema = {id: String};
    schema[foreignKey] = String;
    var otherModel = thinky.createModel(modelNames[1], schema);

    model.hasMany(otherModel, "otherDocs", "modelId", foreignKey);

    otherModel.once("ready", function() {
      r.table(otherModel.getTableName()).indexList().run().then(function(result) {
        r.table(otherModel.getTableName()).indexWait(foreignKey).run().then(function() {
          done();
        }).error(done);

      }).error(done);
    })
  });

  it('hasAndBelongsToMany should create an index on this table', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String, notid1: String });

    var otherModel = thinky.createModel(modelNames[1], { id: String, notid2: String });

    model.hasAndBelongsToMany(otherModel, "otherDocs", "notid1", "notid2");

    var linkName;
    if(model.getTableName() < otherModel.getTableName()) {
      linkName = model.getTableName()+"_"+otherModel.getTableName();
    }
    else {
      linkName = otherModel.getTableName()+"_"+model.getTableName();
    }

    model.once("ready", function() {
      r.table(model.getTableName()).indexList().run().then(function(result) {
        r.table(model.getTableName()).indexWait("notid1").run().then(function() {
          done();
        }).error(done);

      }).error(done);
    })
  });

  it('hasAndBelongsToMany should create an index on the joined table', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String, notid1: String });

    var otherModel = thinky.createModel(modelNames[1], { id: String, notid2: String });

    model.hasAndBelongsToMany(otherModel, "otherDocs", "notid1", "notid2");

    var linkName;
    if(model.getTableName() < otherModel.getTableName()) {
      linkName = model.getTableName()+"_"+otherModel.getTableName();
    }
    else {
      linkName = otherModel.getTableName()+"_"+model.getTableName();
    }

    otherModel.once("ready", function() {
      r.table(otherModel.getTableName()).indexList().run().then(function(result) {
        r.table(otherModel.getTableName()).indexWait("notid2").run().then(function() {
          done();
        }).error(done);
      }).error(done);
    })
  });

  it('hasAndBelongsToMany should create a linked table with indexes', function(done) {
    var model = thinky.createModel(modelNames[0], { id: String, notid1: String });

    var otherModel = thinky.createModel(modelNames[1], { id: String, notid2: String });

    model.hasAndBelongsToMany(otherModel, "otherDocs", "notid1", "notid2");

    var linkName;
    if(model.getTableName() < otherModel.getTableName()) {
      linkName = model.getTableName()+"_"+otherModel.getTableName();
    }
    else {
      linkName = otherModel.getTableName()+"_"+model.getTableName();
    }

    var numReady = 0;

    model.once('ready', function() {
      r.table(linkName).indexList().run().then(function(result) {
        r.table(otherModel.getTableName()).indexWait("notid2").run().then(function() {
          done();
        }).error(done);
      }).error(done);
    });
  });
  it('_apply is reserved ', function() {
    var model = thinky.createModel(modelNames[0], { id: String, notid1: String }, {init: false});

    var otherModel = thinky.createModel(modelNames[1], { id: String, notid2: String }, {init: false});

    assert.throws(function() {
      model.hasOne(otherModel, "_apply", "notid1", "notid2", {init: false});
    }, function(error) {
      return (error instanceof Error) && (error.message === "The field `_apply` is reserved by thinky. Please use another one.")
    });
    assert.throws(function() {
      model.hasMany(otherModel, "_apply", "notid1", "notid2", {init: false});
    }, function(error) {
      return (error instanceof Error) && (error.message === "The field `_apply` is reserved by thinky. Please use another one.")
    });
    assert.throws(function() {
      model.belongsTo(otherModel, "_apply", "notid1", "notid2", {init: false});
    }, function(error) {
      return (error instanceof Error) && (error.message === "The field `_apply` is reserved by thinky. Please use another one.")
    });
    assert.throws(function() {
      model.hasAndBelongsToMany(otherModel, "_apply", "notid1", "notid2", {init: false});
    }, function(error) {
      return (error instanceof Error) && (error.message === "The field `_apply` is reserved by thinky. Please use another one.")
    });
  });
});

describe('define', function(){
  afterEach(cleanTables);

  it('Should be added on the document', function(done) {
    var Model = thinky.createModel(modelNames[0], { id: String, num: Number }, {init: false});
    Model.define('foo', function() { done() });
    var doc = new Model({});
    doc.foo();
  });
  it('this should refer to the doc', function(done) {
    var str = util.s8();
    var Model = thinky.createModel(modelNames[0], { id: String, num: Number }, {init: false});
    Model.define('foo', function() { assert.equal(this.id, str); done() });
    var doc = new Model({id: str});
    doc.foo();
  });
});
describe('static', function(){
  afterEach(cleanTables);

  it('Should be added on the model', function(done) {
    var Model = thinky.createModel(modelNames[0], { id: String, num: Number }, {init: false});
    Model.defineStatic('foo', function() { done() });
    Model.foo();
  });
  it('this should refer to the model', function(done) {
    var Model = thinky.createModel(modelNames[0], { id: String, num: Number }, {init: false});
    Model.defineStatic('foo', function() { this.bar() });
    Model.defineStatic('bar', function() { done() });
    Model.foo();
  });
  it('Should be added on the model\'s queries', function(done) {
    var Model = thinky.createModel(modelNames[0], { id: String });
    var Other = thinky.createModel(modelNames[1], { id: String });

    Model.hasOne(Other, 'other', 'id', 'modelId');
    Other.belongsTo(Model, 'model', 'modelId', 'id');

    Other.defineStatic('foo', function() {
      return this.merge({bar: true})
    });

    var doc1 = new Model({});
    var doc2 = new Other({model: doc1});

    doc2.saveAll().then(function() {
      return Model.getJoin({
        other: {
          _apply: function(query) {
            return query.foo()
          }
        }
      }).run()
    }).then(function(docs) {
      assert.equal(docs[0].other.bar, true);
      done()
    });
  });
});
describe('ensureIndex', function(){
  afterEach(cleanTables);

  it('should add an index', function(done) {
    var Model = thinky.createModel(modelNames[0], { id: String, num: Number });
    Model.ensureIndex("num");
    var doc = new Model({});
    doc.save().then(function(result) {
      Model.orderBy({index: "num"}).run().then(function(result) {
        done();
      });
    });
  });
  it('should add an index with multi', function(done) {
    var Model = thinky.createModel(modelNames[0], { id: String, nums: [Number] });
    Model.ensureIndex("nums", function(doc) { return doc("nums") }, {multi: true});
    var doc = new Model({nums: [1,2,3]});
    doc.save().then(function(result) {
      return Model.getAll(1, {index: "nums"}).run()
    }).then(function(result) {
      assert.equal(result.length, 1);
      return Model.getAll(2, {index: "nums"}).run()
    }).then(function(result) {
      assert.equal(result.length, 1);
      done();
    });
  });
  it('should accept ensureIndex(name, opts)', function(done) {
    var Model = thinky.createModel(modelNames[0], { id: String, location: type.point() });
    Model.ensureIndex("location", {geo: true});
    var doc = new Model({location: [1,2]});
    doc.save().then(function(result) {
      return Model.getIntersecting(r.circle([1,2], 1), {index: "location"}).run()
    }).then(function(result) {
      assert.equal(result.length, 1);
      return Model.getIntersecting(r.circle([3,2], 1), {index: "location"}).run()
    }).then(function(result) {
      assert.equal(result.length, 0);
      done();
    });
  });

});

describe('virtual', function(){
  afterEach(cleanTables);

  it('pass schema validation', function() {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual'
      }
    });
  });
  it('Generate fields', function() {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num+2
        }
      }
    });
    var doc = new Model({
      num: 1
    })
    assert.equal(doc.numVirtual, 3);
  });
  it('Generate fields -- manually', function() {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num+2
        }
      }
    });
    var doc = new Model({
      num: 1
    })
    assert.equal(doc.numVirtual, 3);
    doc.num = 2
    assert.equal(doc.numVirtual, 3);
    doc.generateVirtualValues();
    assert.equal(doc.numVirtual, 4);
  });
  it('Validate fields', function() {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual'
      }
    });
    var doc = new Model({
      num: 1
    })
    doc.validate();
  });
  it('Virtual fields should not be saved', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      num: Number,
      numVirtual: {
        _type: 'virtual'
      }
    });
    var doc = new Model({
      id: 1,
      num: 1,
      numVirtual: 3
    })
    doc.save().then(function(result) {
      return Model.get(1).execute();
    }).then(function(result) {
      assert.equal(result.numVirtual, undefined);
      done();
    }).error(done);
  });
  it('Virtual fields should not be saved but still regenerated once retrieved', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      num: Number,
      numVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num+2
        }
      }
    });
    var doc = new Model({
      id: 1,
      num: 1
    })
    assert.equal(doc.numVirtual, 3);
    doc.save().then(function(result) {
      assert.equal(result.numVirtual, 3);
      return Model.get(1).execute()
    }).then(function(result) {
      assert.equal(result.numVirtual, undefined);
      return Model.get(1).run()
    }).then(function(result) {
      assert.equal(result.numVirtual, 3);

      done();
    }).error(done);
  });
  it('Virtual fields should not be saved but should be put back later (if no default)', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      num: Number,
      numVirtual: {
        _type: 'virtual'
      }
    });
    var doc = new Model({
      id: 1,
      num: 1,
      numVirtual: 10
    })
    doc.save().then(function(result) {
      assert.equal(result.numVirtual, 10);
      return Model.get(1).execute()
    }).then(function(result) {
      assert.equal(result.numVirtual, undefined);

      done();
    }).error(done).catch(done);
  });
  it('Virtual fields should be genrated after other default values', function() {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      anumVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num+1;
        }
      },
      num: {
        _type: Number,
        default: function() {
          return 2;
        }
      },
      numVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num+1;
        }
      }
    });
    var doc = new Model({
      id: 1
    })
    assert.equal(doc.numVirtual, 3);
    assert.equal(doc.anumVirtual, 3);
  });
  it('Virtual fields should be not be generated if a parent is undefined', function() {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      nested: {
        field: {
          _type: "virtual",
          default: function() {
            return 3;
          }
        }
      }
    });
    var doc = new Model({
      id: 1
    })
    doc.generateVirtualValues()
    assert.equal(doc.nested, undefined);
  });
  it('Virtual fields should not throw if a parent has the wrong type', function() {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      ar: type.array().schema({
        num: type.number().default(3)
      }).options({enforce_type: "none"})
    });
    var doc = new Model({
      id: 1,
      ar: 3
    })
    doc._generateDefault();
    assert.equal(doc.ar, 3);
  });

  it('Virtual fields should work in nested arrays', function() {
    var Model = thinky.createModel(modelNames[0], {
      nested : [
        {
          foo: String,
          bar: type.virtual().default(function() {
            return "buzz";
          })
        }
      ]
    });
    var doc = new Model({
      nested : [
        {
          foo: 'hello'
        }
      ]
    });

    assert.equal(doc.nested[0].bar, 'buzz');
  });

});
