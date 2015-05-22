var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;
var Document = require(__dirname+'/../lib/document.js');

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
  Promise.settle(promises).finally(function() {
    // Add the links table
    for(var model in thinky.models) {
      modelNameSet[model] = true;
    }
    modelNames = Object.keys(modelNameSet);
    thinky._clean();
    done();
  });
}

describe('Model queries', function() {
  var Model;
  var data = [];
  var bag = {};
  before(function(done) {
    Model = thinky.createModel(modelNames[0], {
      id: String,
      str: String,
      num: Number
    })
    var str = util.s8();
    var num = util.random();

    doc = new Model({
      str: str,
      num: num
    })
    doc.save().then(function(result) {
      data.push(result);

      str = util.s8();
      num = util.random();
      doc = new Model({
        str: str,
        num: num
      });
      return doc.save();
    }).then(function(result) {
      data.push(result);

      str = util.s8();
      num = util.random();
      doc = new Model({
        str: str,
        num: num
      });
      return doc.save();
    }).then(function(result) {
      data.push(result);

      for(var i=0; i<data.length; i++) {
        bag[data[i].id] = data[i]
      }

      done()
    }).error(done);
  });


  after(cleanTables);

  it('Model.run() should return', function(done){
    Model.run().then(function(result) {
      done();
    }).error(done);
  });
  it('Model.run() should take a callback', function(done){
    Model.run(function(err, result) {
      done();
    })
  });
  it('Model.run() should return the data', function(done){
    Model.run().then(function(result) {
      assert.equal(result.length, 3);
      var newBag = {};
      for(var i=0; i<result.length; i++) {
        newBag[result[i].id] = result[i]
      }
      assert.equal(result.length, 3);
      assert.deepEqual(bag, newBag);
      done();
    }).error(done);
  });
  it('Model.run() should return instances of Document', function(done){
    Model.run().then(function(result) {
      assert.equal(result.length, 3);
      for(var i=0; i<result.length; i++) {
        assert(result[i] instanceof Document);
      }
      done();
    }).error(done);
  });
  it('Model.run() should return instances of the model', function(done){
    Model.run().then(function(result) {
      assert.equal(result.length, 3);
      for(var i=0; i<result.length; i++) {
        assert.deepEqual(result[i].__proto__.constructor, Model);
        assert.deepEqual(result[i].constructor, Model);
      }
      done();
    }).error(done);
  });
  it('Model.add(1).run() should be able to error', function(done){
    Model.add(1).run().then(function(result) {
      done(new Error("The promise should not be resolved."))
    }).error(function(error) {
      assert(error.message.match(/^Expected type DATUM but found TABLE/));
      done();
    });
  });
  it('Model.map(1).run should error', function(done){
    Model.map(function() { return 1 }).run().then(function(result) {
      done(new Error("The promise should not be resolved."))
    }).error(function(error) {
      assert.equal(error.message, "The results could not be converted to instances of `"+Model.getTableName()+"`\nDetailed error: Cannot build a new instance of `"+Model.getTableName()+"` without an object")
      done();
    });
  });
  it('Model.get() should return the expected document', function(done){
    Model.get(data[0].id).run().then(function(result) {
      assert.deepEqual(data[0], result);
      done();
    }).error(done);
  });
  it('Model.get().merge(..) should throw before calling merge', function(done){
    Model.get("NonExistingKey").merge({foo: "bar"}).run().then(function(result) {
      done(new Error("Was expecting an error"));
    }).error(function(error) {
      assert(error.message.match(/^The query did not find a document and returned null./));
      done();
    });
  });

  it('Model.get() should return an instance of the model', function(done){
    Model.get(data[0].id).run().then(function(result) {
      assert.deepEqual(result.__proto__.constructor, Model);
      assert.deepEqual(result.constructor, Model);
      done();
    }).error(done);
  });
  it('Model.group("foo").run should work -- without extra argument', function(done){
    Model.group("foo").run().then(function(result) {
      for(var i=0; i<result.length; i++) {
        var group = result[i];
        for(var i=0; i<group.reduction.length; i++) {
          assert(group.reduction[i] instanceof Document);
          assert(group.reduction[i].isSaved());
        }
      }
      done()
    }).error(function(error) {
      done();
    });
  });
  it('Model.group("foo").run should work', function(done){
    Model.group("foo").run({groupFormat: 'raw'}).then(function(result) {
      for(var i=0; i<result.length; i++) {
        var group = result[i];
        for(var i=0; i<group.reduction.length; i++) {
          assert(group.reduction[i] instanceof Document);
          assert(group.reduction[i].isSaved());
        }
      }
      done()
    }).error(function(error) {
      done();
    });
  });
  it('Model.group("foo").run should not create instance of doc with groupFormat=native', function(done){
    Model.group("foo").run({groupFormat: 'native'}).then(function(result) {
      for(var i=0; i<result.length; i++) {
        var group = result[i];
        for(var i=0; i<group.reduction.length; i++) {
          assert.equal(group.reduction[i] instanceof Document, false);
        }
      }
      done()
    }).error(function(error) {
      done();
    });
  });

   
  it('Model.filter() should work', function(done){
    Model.filter(true).run().then(function(result) {
      assert.equal(result.length, 3);

      var newBag = {};
      for(var i=0; i<result.length; i++) {
        newBag[result[i].id] = result[i]
      }
      assert.equal(result.length, 3);
      assert.deepEqual(bag, newBag);

      for(var i=0; i<result.length; i++) {
        assert(result[i] instanceof Document);
        assert.deepEqual(result[i].__proto__.constructor, Model);
        assert.deepEqual(result[i].constructor, Model);
      }
      done();

    }).error(done);
  });
  it('Model.filter(false) should work', function(done){
    Model.filter(false).run().then(function(result) {
      assert.equal(result.length, 0);
      done();
    }).error(done);
  });
  it('Model.execute should not return instances of the model', function(done){
    Model.execute().then(function(cursor) {
      cursor.toArray().then(function(result) {
        assert(!(result[0] instanceof Document));
        assert.equal(result.length, 3);
        done();
      });
    }).error(done);
  });
  it('Model.execute should work with a callback', function(done){
    Model.execute(function(err, cursor) {
      cursor.toArray().then(function(result) {
        assert(!(result[0] instanceof Document));
        assert.equal(result.length, 3);
        done();
      });
    }).error(done);
  });

  it('Model.map(1).execute should work', function(done){
    Model.map(function() { return 1 }).execute().then(function(cursor) {
      cursor.toArray().then(function(result) {
        assert(!(result[0] instanceof Document));
        assert.equal(result.length, 3);
        done();
      })
    }).error(done);
  });
  it('Model.add(1).execute() should be able to error', function(done){
    Model.add(1).execute().then(function(result) {
      done(new Error("The promise should not be resolved."))
    }).error(function(error) {
      assert(error.message.match(/^Expected type DATUM but found TABLE/));
      done();
    });
  });
});

describe('getJoin', function(){
  describe("Joins - hasOne", function() {
    var Model, OtherModel, doc
    before(function(done) {
      var name = util.s8();
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number
      })


      var otherName = util.s8();
      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number,
        foreignKey: String
      })
      Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey")

      var docValues = {str: util.s8(), num: util.random()}
      var otherDocValues = {str: util.s8(), num: util.random()}

      doc = new Model(docValues);
      var otherDoc = new OtherModel(otherDocValues);
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function(doc) {
        done();
      });
    });

    after(cleanTables);

    it('should retrieve joined documents with object', function(done) {
      Model.get(doc.id).getJoin().run().then(function(result) {
        assert.deepEqual(doc, result);
        assert(result.isSaved());
        assert(result.otherDoc.isSaved());
        done()
      }).error(done);
    })
    it('should retrieve joined documents with sequence', function(done) {
      Model.filter({id: doc.id}).getJoin().run().then(function(result) {
        assert.deepEqual([doc], result);
        assert(result[0].isSaved());
        assert(result[0].otherDoc.isSaved());
        done()
      }).error(done);
    })
  })
  describe("Joins - belongsTo", function() {
    var Model, OtherModel, doc
    before(function(done) {
      var name = util.s8();
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number,
        foreignKey: String
      })

      var otherName = util.s8();
      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number
      })
      Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id")

      var docValues = {str: util.s8(), num: util.random()}
      var otherDocValues = {str: util.s8(), num: util.random()}

      doc = new Model(docValues);
      var otherDoc = new OtherModel(otherDocValues);
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function(doc) {
        done();
      });
    });

    after(cleanTables);

    it('should retrieve joined documents with object', function(done) {
      Model.get(doc.id).getJoin().run().then(function(result) {
        assert.deepEqual(doc, result);
        assert(result.isSaved());
        assert(result.otherDoc.isSaved());
        done()
      }).error(done);
    })
    it('should retrieve joined documents with sequence', function(done) {
      Model.filter({id: doc.id}).getJoin().run().then(function(result) {
        assert.deepEqual([doc], result);
        assert(result[0].isSaved());
        assert(result[0].otherDoc.isSaved());
        done()
      }).error(done);
    })
  })
  describe("Joins - hasMany", function() {
    var Model, OtherModel, doc;
    before(function(done) {
      var name = util.s8();
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number
      })

      var otherName = util.s8();
      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number,
        foreignKey: String
      })
      Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey")

      var docValues = {str: util.s8(), num: util.random()}
      doc = new Model(docValues);
      var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
      doc.otherDocs = otherDocs;

      doc.saveAll().then(function(doc) {
        util.sortById(doc.otherDocs);
        done();
      }).error(done);

    });

    after(cleanTables);

    it('should retrieve joined documents with object', function(done) {
      Model.get(doc.id).getJoin().run().then(function(result) {
        util.sortById(result.otherDocs);

        assert.deepEqual(doc, result);
        assert(result.isSaved());
        for(var i=0; i<result.otherDocs.length; i++) {
          assert.equal(result.otherDocs[i].isSaved(), true);
        }
        done()
      }).error(done);
    })
    it('should retrieve joined documents with sequence', function(done) {
      Model.filter({id: doc.id}).getJoin().run().then(function(result) {
        util.sortById(result[0].otherDocs);

        assert.deepEqual([doc], result);
        assert(result[0].isSaved());
        for(var i=0; i<result[0].otherDocs.length; i++) {
          assert.equal(result[0].otherDocs[i].isSaved(), true);
        }

        done()
      }).error(done);
    })
  })
  describe("Joins - hasAndBelongsToMany", function() {
    var Model, OtherModel, doc;
    before(function(done) {
      var name = util.s8();
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number
      })

      var otherName = util.s8();
      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number,
      })
      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")

      var docValues = {str: util.s8(), num: util.random()}
      doc = new Model(docValues);
      var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
      doc.otherDocs = otherDocs;

      doc.saveAll().then(function(doc) {
        util.sortById(doc.otherDocs);
        done();
      }).error(done);

    });

    after(cleanTables);

    it('should retrieve joined documents with object', function(done) {
      Model.get(doc.id).getJoin().run().then(function(result) {
        util.sortById(result.otherDocs);

        assert.deepEqual(doc, result);
        assert(result.isSaved());
        for(var i=0; i<result.otherDocs.length; i++) {
          assert.equal(result.otherDocs[i].isSaved(), true);
        }
        done()
      }).error(done);
    })
    it('should retrieve joined documents with sequence', function(done) {
      Model.filter({id: doc.id}).getJoin().run().then(function(result) {
        util.sortById(result[0].otherDocs);

        assert.deepEqual([doc], result);
        assert(result[0].isSaved());
        for(var i=0; i<result[0].otherDocs.length; i++) {
          assert.equal(result[0].otherDocs[i].isSaved(), true);
        }

        done()
      }).error(done);
    })
  })
  describe('options', function() {
    afterEach(cleanTables);

    it('hasMany - belongsTo', function(done) {
      var name = util.s8();
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var otherName = util.s8();
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues)
      ];

      doc.has = otherDocs;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin({has: { _apply: function(seq) {
          return seq.orderBy('id').limit(5);
        }}}).run().then(function(result) {
          for(var i=0; i<result.has.length; i++) {
            for(var j=i+1; j<result.has.length; j++) {
              assert(result.has[i].id < result.has[j].id)
            }
          }
          assert.equal(result.has.length, 5);
          done();
        });
      }).error(done);
    });
    it('_apply should work with count (not coerce to arrays)', function(done) {
      var name = util.s8();
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var otherName = util.s8();
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [
        new OtherModel(otherValues),
        new OtherModel(otherValues),
        new OtherModel(otherValues)
      ];

      doc.has = otherDocs;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin({has: { _apply: function(seq) {
          return seq.count()
        }, _array: false}}).run().then(function(result) {
          assert.equal(result.has, 3);
          done();
        });
      }).error(done);
    });

  });
  describe("should not throw with missing keys", function() {
    afterEach(cleanTables);

    var Model, OtherModel;
    it('hasOne', function(done) {
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number
      })

      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number,
        foreignKey: String
      })
      Model.hasOne(OtherModel, "otherDoc", "str", "foreignKey")

      var doc = new Model({
        id: util.s8(),
        num: 1
      })
      doc.save().then(function() {
        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.otherDoc, undefined);
          done();
        }).error(done);
      }).error(done);
    });
    it('belongsTo', function(done) {
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number,
        foreignKey: String
      })

      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number
      })
      Model.belongsTo(OtherModel, "otherDoc", "str", "id")

      var docValues = {num: util.random(), foreignKey: util.s8()}
      doc = new Model(docValues);

      doc.save().then(function(doc) {
        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.otherDoc, undefined);
          done();
        }).error(done);
      });
    });
    it('hasMany', function(done) {
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number
      })

      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number,
        foreignKey: String
      })
      Model.hasMany(OtherModel, "otherDocs", "str", "foreignKey")

      var docValues = {num: util.random()}
      doc = new Model(docValues);
      doc.save().then(function() {
        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.otherDocs, undefined);
          done();
        }).error(done);
      });
    });
    it('hasAndBelongsToMany', function(done) {
      Model = thinky.createModel(modelNames[0], {
        id: String,
        str: String,
        num: Number
      })

      OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        str: String,
        num: Number,
      })
      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "str", "id")

      var docValues = {num: util.random()}
      doc = new Model(docValues);

      doc.save().then(function(doc) {
        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.otherDocs, undefined);
          done();
        }).error(done);
      }).error(done);

    });
  });
});

describe('removeRelations', function(){
  afterEach(cleanTables);

  it('should work for hasOne', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      str: String,
      num: Number
    });

    var otherName = util.s8();
    var OtherModel = thinky.createModel(modelNames[1], {
      id: String,
      str: String,
      num: Number,
      foreignKey: String
    })
    Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey")

    var docValues = {str: util.s8(), num: util.random()}
    var otherDocValues = {str: util.s8(), num: util.random()}

    doc = new Model(docValues);
    var otherDoc = new OtherModel(otherDocValues);
    doc.otherDoc = otherDoc;

    doc.saveAll().then(function(doc) {
      return Model.get(doc.id).removeRelations({otherDoc: true}).run()
    }).then(function(doc) {
      return OtherModel.get(otherDoc.id).run()
    }).then(function(doc) {
      assert.equal(doc.foreignKey, undefined);
      done();
    });
  });

  it('should work for hasMany', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      str: String,
      num: Number
    });

    var otherName = util.s8();
    var OtherModel = thinky.createModel(modelNames[1], {
      id: String,
      str: String,
      num: Number,
      foreignKey: String
    })
    Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey")

    var docValues = {str: util.s8(), num: util.random()}
    var otherDocValues = {str: util.s8(), num: util.random()}

    doc = new Model(docValues);
    var otherDoc = new OtherModel(otherDocValues);
    doc.otherDocs = [otherDoc];

    doc.saveAll().then(function(doc) {
      return Model.get(doc.id).removeRelations({otherDocs: true}).run()
    }).then(function(doc) {
      return OtherModel.get(otherDoc.id).run()
    }).then(function(doc) {
      assert.equal(doc.foreignKey, undefined);
      done();
    });
  });

  it('should work for belongsTo', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      str: String,
      num: Number,
      foreignKey: String
    });

    var otherName = util.s8();
    var OtherModel = thinky.createModel(modelNames[1], {
      id: String,
      str: String,
      num: Number
    })
    Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id")

    var docValues = {str: util.s8(), num: util.random()}
    var otherDocValues = {str: util.s8(), num: util.random()}

    doc = new Model(docValues);
    var otherDoc = new OtherModel(otherDocValues);
    doc.otherDoc = otherDoc;

    doc.saveAll().then(function(doc) {
      return Model.get(doc.id).removeRelations({otherDoc: true}).run()
    }).then(function(doc) {
      assert.equal(doc.foreignKey, undefined);
      return Model.get(doc.id).run()
    }).then(function(doc) {
      assert.equal(doc.foreignKey, undefined);
      done();
    });
  });

  it('should work for hasAndBelongsTo', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      str: String,
      num: Number
    });

    var otherName = util.s8();
    var OtherModel = thinky.createModel(modelNames[1], {
      id: String,
      str: String,
      num: Number,
      foreignKey: String
    })
    Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")

    var docValues = {str: util.s8(), num: util.random()}
    var otherDocValues = {str: util.s8(), num: util.random()}

    doc = new Model(docValues);
    var otherDoc = new OtherModel(otherDocValues);
    doc.otherDocs = [otherDoc];

    doc.saveAll().then(function(doc) {
      return Model.get(doc.id).removeRelations({otherDocs: true}).run()
    }).then(function(doc) {
      return Model.get(doc.id).getJoin({otherDocs: true}).run()
    }).then(function(doc) {
      assert.equal(doc.otherDocs.length, 0);
      done();
    });
  });
});

describe('Query.run() should take options', function(){
  var Model;
  var data = [];
  before(function(done) {
    var name = util.s8();
    Model = thinky.createModel(modelNames[0], {
      id: String,
      str: String,
      num: Number
    })
    var str = util.s8();

    doc = new Model({
      str: str,
      num: 1
    })
    doc.save().then(function(result) {
      data.push(result);

      str = util.s8();
      doc = new Model({
        str: str,
        num: 1
      }).save().then(function(result) {
        data.push(result);

        str = util.s8();
        doc = new Model({
          str: str,
          num: 2
        }).save().then(function(result) {
          data.push(result);

          done()
        }).error(done);
      }).error(done);
    }).error(done);
  });

  after(cleanTables);

  it('Query.run() should return a DocumentNotFound error if no document is found - 1', function(done){
    var Errors = thinky.Errors;
    Model.get(0).run().then(function() {
      done(new Error("Was expecting an error"))
    }).catch(Errors.DocumentNotFound, function(err) {
      assert(err.message.match(/^The query did not find a document and returned null./));
      done();
    }).error(function() {
      done(new Error("Not the expected error"))
    });
  });
  it('Query.run() should return a DocumentNotFound error if no document is found - 2', function(done){
    var Errors = thinky.Errors;
    Model.get(0).run().then(function() {
      done(new Error("Was expecting an error"))
    }).error(function(err) {
      assert(err instanceof Errors.DocumentNotFound);
      assert(err.message.match(/^The query did not find a document and returned null./));
      done();
    });
  });
  it('Query.run() should parse objects in each group', function(done){
    Model.group('num').run().then(function(result) {
      assert.equal(result.length, 2);
      for(var i=0; i<result.length; i++) {
        assert(result[i].group)
        assert(result[i].reduction.length > 0)
        for(var j=0; j<result[i].reduction.length; j++) {
          assert.equal(result[i].reduction[j].isSaved(), true);
        }
      }
      done();
    }).error(done);
  });
  it('Query.run({groupFormat: "raw"}) should be ignored', function(done){
    Model.group('num').run({groupFormat: "raw"}).then(function(result) {
      assert.equal(result.length, 2);
      for(var i=0; i<result.length; i++) {
        assert(result[i].group)
        assert(result[i].reduction.length > 0)
      }
      done();
    }).error(done);
  });
  it('Query.execute({groupFormat: "raw"}) should not be ignored', function(done){
    Model.group('num').execute({groupFormat: "raw"}).then(function(result) {
      assert.equal(result.$reql_type$, "GROUPED_DATA");
      assert.equal(result.data.length, 2);
      for(var i=0; i<result.data.length; i++) {
        assert.equal(result.data[i].length, 2)
      }
      done();
    }).error(done);
  });
  it('Query.group("num").count().run() should not work', function(done){
    Model.group('num').count().run().then(function(result) {
      done(new Error("Should have thrown an error"))
    }).error(function(err) {
      done()
    });
  });
  it('Query.group("num").max("id").run() should not work', function(done){
    Model.group('num').max('id').run().then(function(result) {
      assert.equal(result.length, 2);
      assert(result[0].reduction instanceof Document);
      done();
    }).error(done);
  });
  it('Query.group("num").count().execute() should work', function(done){
    Model.group('num').count().execute().then(function(result) {
      assert.equal(result.length, 2);
      assert((result[0].reduction === 2 && result[0].group === 1) ||(result[0].reduction === 1 && result[0].group === 2))
      done()
    }).error(done);
  });
});

describe('thinky.Query', function() {
  afterEach(cleanTables);
  it('Manual query', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String});

    var query = new Query(User, r);
    query.expr(1).execute().then(function(result) {
      assert.equal(result, 1);
      var user = new User({});
      user.save().then(function(saved) {
        query = new Query(User, r);
        query.table(User.getTableName()).nth(0).run().then(function(doc) {
          assert.deepEqual(doc, saved);
          done();
        });
      });
    });
  });
});
describe('then', function() {
  afterEach(cleanTables);

  it('should run the query and call handler (naked table)', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    User.then(function() {
        done();
    });
  });
  it('should run the query and call handler', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    User.filter({}).then(function() {
        done();
    });
  });
  it('should return a promise', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    var promise = User.filter({}).then(function() {});
    assert(promise instanceof Promise, 'not a promise');

    promise.finally(function() {
        done();
    });
  });
});
describe('error', function() {
  afterEach(cleanTables);

  it('should run the query and call handler', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    User.filter(r.error('test')).error(function() {
        done();
    });
  });
  it('should return a promise', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    var promise = User.filter(r.error('test')).error(function() {});
    assert(promise instanceof Promise, 'not a promise');

    promise.finally(function() {
        done();
    });
  });
});
describe('catch', function() {
  afterEach(cleanTables);

  it('should run the query and call handler', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    User.filter(r.error('test')).catch(function() {
        done();
    });
  });
  it('should return a promise', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    var promise = User.filter(r.error('test')).catch(function() {});
    assert(promise instanceof Promise, 'not a promise');

    promise.finally(function() {
        done();
    });
  });
});
describe('finally', function() {
  afterEach(cleanTables);

  it('should run the query and call handler', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    User.filter({}).finally(function() {
        done();
    });
  });
  it('should return a promise', function(done) {
    var name = util.s8();

    var Query = thinky.Query;
    var r = thinky.r;
    var User = thinky.createModel(modelNames[0], {id: String}, {init: false});

    var promise = User.filter({}).finally(function() {});
    assert(promise instanceof Promise, 'not a promise');

    promise.finally(function() {
        done();
    });
  });
});
describe('clone', function() {
  afterEach(cleanTables);

  it('people should be able to fork queries', function(done) {
    var name = util.s8();
    var Model = thinky.createModel(modelNames[0], {id: String});
    var query = Model.filter(true);
    
    var result = 0;
    query.count().execute().then(function(result) {
      assert.equal(result, 0);
      result++;
      if (result === 2) { done() };
    });
    query.count().add(1).execute().then(function(result) {
      assert.equal(result, 1);
      result++;
      if (result === 2) { done() };
    });
  });
});

describe('optimizer', function() {
  afterEach(cleanTables);

  // Test that the queries built under the hood are optimized by having the server throw an error
  var Model;
  before(function(done) {
    var name = util.s8();
    r.tableCreate(name).run().then(function(result) {
      
      r.table(name).indexCreate('name1').run().then(function() {

        Model = thinky.createModel(modelNames[0], {
          id: String,
          name1: String,
          name2: String,
          hasOneKey: String,
          belongsToKey: String,
          hasMany: String,
          hasAndBelongsToMany1: String,
          hasAndBelongsToMany2: String
        })
        Model.hasOne(Model, 'other', 'id', 'hasOneKey')
        Model.hasMany(Model, 'others', 'id', 'hasManyKey')
        Model.belongsTo(Model, 'belongsTo', 'belongsToKey', 'id')
        Model.hasAndBelongsToMany(Model, 'manyToMany', 'hasAndBelongsToMany1', 'hasAndBelongsToMany2')

        Model.ensureIndex('name1');
        Model.once('ready', function() {
          done();
        })
      }).error(done);
    }).error(done);
  });
  it('orderBy should be able to use an index - thanks to ensureIndex', function() {
    var query = Model.orderBy('name1').toString();
    assert(query.match(/index: "name1"/));
  })
  it('orderBy should be able to use an index - thanks to hasOne', function() {
    var query = Model.orderBy('hasOneKey').toString();
    assert(query.match(/index: "hasOneKey"/));
  })
  it('orderBy should be able to use an index - thanks to hasMany', function() {
    var query = Model.orderBy('hasManyKey').toString();
    assert(query.match(/index: "hasManyKey"/));
  })
  it('orderBy should be able to use an index - thanks to belongsTo', function() {
    var query = Model.orderBy('belongsToKey').toString()
    assert(query.match(/index: "belongsToKey"/));
  })
  it('orderBy should be able to use an index - thanks to hasAndBelongsToMany - 1', function() {
    var query = Model.orderBy('hasAndBelongsToMany1').toString();
    assert(query.match(/index: "hasAndBelongsToMany1"/));
  })
  it('orderBy should be able to use an index - thanks to hasAndBelongsToMany - 2', function() {
    var query = Model.orderBy('hasAndBelongsToMany2').toString();
    assert(query.match(/index: "hasAndBelongsToMany2"/));
  })
  it('orderBy should be able to use an index - thanks to indexList', function() {
    var query = Model.orderBy('name1').toString();
    assert(query.match(/index: "name1"/));
  })
  it('filter should be able to use an index - single field', function() {
    var query = Model.filter({name1: "Michel"}).toString();
    assert(query.match(/index: "name1"/));
  })
  it('filter should be able to use an index - multiple fields', function() {
    var query = Model.filter({name1: "Michel", foo: "bar"}).toString();
    assert.equal(query.replace(/\s/g, ''), 'r.table("'+Model.getTableName()+'").getAll("Michel",{index:"name1"}).filter({foo:"bar"})')
  })
  it('filter should not optimize a field without index', function() {
    var query = Model.filter({name2: "Michel"}).toString();
    assert.equal(query.match(/index: "name2"/), null);
  })

  it('filter should use an index only on a table', function() {
    var query = Model.filter({foo: "bar"}).filter({name1: "Michel"}).toString();
    assert(query.match(/index: "name1"/) === null);
  })
});

describe('In place writes', function() {
  afterEach(cleanTables);
  it('Point write - valid', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    var doc = new Model({id: util.s8(), num: 0});
    doc.save().then(function() {
      return Model.get(doc.id).update({num: 1}).run()
    }).then(function(result) {
      assert(result);
      assert.equal(result.id, doc.id);
      assert.equal(result.num, 1);
      return Model.get(doc.id).update({num: 1}).run()
    }).then(function(result) {
      // We currently do not run another point read after a write.
      assert.equal(result, undefined);
      done();
    }).error(done);
  })
  it('Point write - post non valid - primary key is a string', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    var doc = new Model({id: util.s8(), num: 0});
    doc.save().then(function() {
      return Model.get(doc.id).update({num: r.expr("foo")}).run()
    }).then(function() {
      done(new Error("Was expecting an error"));
    }).error(function(error) {
      assert(error.message.match("The write failed, and the changes were reverted"));
      Model.get(doc.id).run().then(function(result) {
        assert.deepEqual(doc, result);
        done();
      }).error(done);
    })
  })
  it('Point write - post non valid - primary key not a string', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      num: Number
    });
    var doc = new Model({id: 1, num: 0});
    doc.save().then(function() {
      return Model.get(doc.id).update({num: r.expr("foo")}).run()
    }).then(function() {
      done(new Error("Was expecting an error"));
    }).error(function(error) {
      assert(error.message.match("The write failed, and the changes were reverted"));
      Model.get(doc.id).run().then(function(result) {
        assert.deepEqual(doc, result);
        done();
      }).error(done);
    })
  })
  it('Range write - valid', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    var docs = [{id: util.s8(), num: 0}, {id: util.s8(), num: 0}];
    Model.save(docs).then(function() {
      return Model.update({num: 1}).run()
    }).then(function(result) {
      assert(result);
      docs.sort(function(a, b) { return (a.id > b.id) ? 1 : -1; });
      result.sort(function(a, b) { return (a.id > b.id) ? 1 : -1; });

      assert.equal(result[0].id, docs[0].id);
      assert.equal(result[1].id, docs[1].id);
      assert.equal(result[0].num, 1);
      assert.equal(result[1].num, 1);
      done();
    }).error(done);
  })
  it('Range write with one doc - valid', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    var docs = [{id: util.s8(), num: 0}, {id: util.s8(), num: 0}];
    Model.save(docs).then(function() {
      return Model.filter({id: docs[0].id}).update({num: 1}).run()
    }).then(function(result) {
      assert(Array.isArray(result));
      assert.equal(result[0].id, docs[0].id);
      assert.equal(result[0].num, 1);
      done();
    }).error(done);
  })

  it('Range write - post non valid - primary key is a string', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    var docs = [{id: util.s8(), num: 0}, {id: util.s8(), num: 1}];
    Model.save(docs).then(function() {
      return Model.update({num: r.expr("foo")}).run()
    }).then(function() {
      done(new Error("Was expecting an error"));
    }).error(function(error) {
      assert(error.message.match("The write failed, and the changes were reverted"));
      Model.run().then(function(result) {
        result.sort(function(a, b) { return (a.num > b.num) ? 1 : -1; });
        assert.equal(result[0].num, 0);
        assert.equal(result[1].num, 1);
        done();
      }).error(done);
    }).error(done);
  })
  it('Range write - post non valid - primary key is not a string', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: Number,
      num: Number
    });
    var docs = [{id: 0, num: 0}, {id: 1, num: 1}];
    Model.save(docs).then(function() {
      return Model.update({num: r.expr("foo")}).run()
    }).then(function() {
      done(new Error("Was expecting an error"));
    }).error(function(error) {
      assert(error.message.match("The write failed, and the changes were reverted"));
      Model.run().then(function(result) {
        result.sort(function(a, b) { return (a.num > b.num) ? 1 : -1; });
        assert.equal(result[0].num, 0);
        assert.equal(result[1].num, 1);
        done();
      }).error(done);

    }).error(done);
  })
  it('Point write - pre non valid', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    var doc = new Model({id: util.s8(), num: 0});
    doc.save().then(function() {
      return Model.get(doc.id).update({num: "foo"}).run()
    }).then(function() {
      done(new Error("Was expecting an error"));
    }).error(function(error) {
      assert(error.message.match(/^The partial value is not valid, so the write was not executed. The original error was:/));
      Model.get(doc.id).run().then(function(result) {
        assert.deepEqual(doc, result);
        done();
      }).error(done);
    })
  })
  it('Point write on non existing doc', function(done) {
    var Model = thinky.createModel(modelNames[0], {
      id: String,
      num: Number
    });
    Model.get('nonExistingId').update({foo: 'bar'}).run().error(function(error) {
      assert(/The query did not find a document and returned null/.test(error.message));
      done();
    });
  })
});
