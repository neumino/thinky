'use strict';

var Promise = require('bluebird'),
    TestFixture = require('./test-fixture'),
    expect = require('chai').expect,
    errors = require('../lib/errors'),
    util = require('./util');

var test = new TestFixture(),
    thinky, type;

before(function() {
  return test.initializeDatabase()
    .then(function() {
      thinky = test.thinky;
      type = thinky.type;
    });
});
after(function() { return test.dropDatabase(); });

describe('createModel', function() {
  afterEach(function() { return test.dropTables(); });

  it('should create a new model', function() {
    var model = thinky.createModel(util.s8(), {
      id: String, name: String
    });

    return model.ready()
      .then(function() { expect(model).to.exist; });
  });

  it('should check if the table was created', function() {
    var modelName = util.s8();
    var model = thinky.createModel(modelName, {
      id: String, name: String
    });

    return model.ready()
      .then(function() {
        return test.r.tableList().run();
      })
      .then(function(result) {
        expect(result).to.contain(modelName);
      });
  });

  it('should create multiple models', function() {
    var model1 = thinky.createModel(util.s8(), {
      id: String, name: String
    });

    var model2 = thinky.createModel(util.s8(), {
      id: String, name: String
    });

    return Promise.all([ model1.ready(), model2.ready() ])
      .then(function() {
        expect(model1).to.not.eql(model2);
      });
  });

  it('should throw error for non existent table access', function() {
    var model = thinky.createModel("nonExistentTable", {
      id: String, name: String
    }, {
      init: false
    });

    return expect(model.get(1).run())
      .to.eventually.be.rejectedWith(/^Table `.*` does not exist in/);
  });
});

describe('[_]getModel', function() {
  it('_getModel', function() {
    var name = util.s8();
    var model = thinky.createModel(util.s8(), {
      id: String, name: String
    }, {
      init: false
    });

    expect(model._getModel()).to.have.property('_name');
  });

  it('getTableName', function() {
    var modelName = util.s8();
    var model = thinky.createModel(modelName, {
      id: String, name: String
    }, {
      init: false
    });

    expect(model).to.have.property('getTableName');
    expect(model.getTableName()).to.equal(modelName);
  });
});

describe('Model', function() {
  before(function() {
    test.models.Model = thinky.createModel(util.s8(), { str: String });
    return test.models.Model.ready();
  });
  after(function() { return test.dropTables(); });
  afterEach(function() { return test.clearTables(); });

  it('should create a new instance of a model', function() {
    var str = util.s8();
    var doc = new test.models.Model({ str: str });

    expect(util.isPlainObject(doc)).to.be.true;
    expect(doc.str).to.eql(str);
  });

  it('should create multiple instances from the same document', function() {
    var str = util.s8();
    var num = util.random();

    var values = { str: str, num: num };
    var doc = new test.models.Model(values);
    var otherDoc = new test.models.Model(values);

    expect(doc).to.eql(values);
    expect(doc).to.not.eql(otherDoc);

    doc.str = doc.str + util.s8();
    expect(doc.str).to.not.eql(otherDoc.str);

    var anotherDoc = new test.models.Model(values);
    expect(anotherDoc).to.not.eql(otherDoc);
    expect(anotherDoc).to.not.eql(doc);
  });

  it('should create two distinct instances with the same options', function() {
    var options = { str: util.s8() };
    var doc1 = new test.models.Model(options);
    var doc2 = new test.models.Model(options);

    expect(doc1).to.not.eql(doc2);
  });

  it('should ensure two instances are different', function() {
    var str1 = util.s8(), str2 = util.s8();
    var doc1 = new test.models.Model({ str: str1 });
    expect(doc1.str).to.equal(str1);

    var doc2 = new test.models.Model({ str: str2 });
    expect(doc2.str).to.equal(str2);
    expect(doc1.str).to.equal(str1);
    expect(doc1).to.not.eql(doc2);
  });

  it('two instances should have different prototypes', function() {
    var doc1 = new test.models.Model({ str: util.s8() });
    var doc2 = new test.models.Model({ str: util.s8() });

    expect(Object.getPrototypeOf(doc1)).to.not.eql(Object.getPrototypeOf(doc2));
  });

  it('two instances should have the same model', function() {
    var doc1 = new test.models.Model({ str: util.s8() });
    var doc2 = new test.models.Model({ str: util.s8() });

    expect(doc1.getModel()).to.eql(doc2.getModel());
  });

  it('docs from different models should not interfere', function() {
    var str = util.s8();
    var doc = new test.models.Model({str: str});

    var otherName = util.s8();
    test.models.OtherModel = thinky.createModel(otherName, {
      str: String
    });

    return test.models.OtherModel.ready()
      .then(function() {
        var otherStr = util.s8();
        var otherDoc = new test.models.OtherModel({ str: otherStr });

        expect(doc.str).to.eql(str);
        expect(otherDoc.str).to.eql(otherStr);

        expect(otherDoc.getModel()).to.not.eql(doc.getModel());

        // TODO: better way to access schema data, maybe Model.getSchema()
        expect(doc.getModel().getTableName()).to.eql(test.models.Model._schema._model._name);
        expect(otherDoc.getModel().getTableName(), otherName);
      });
  });

});

describe("Batch insert", function() {
  afterEach(function() { return test.dropTables(); });

  it('should insert a single document', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    });

    return Model.ready()
      .then(function() {
        return Model.save({ id: 'foo' });
      })
      .then(function(result) {
        // NOTE: deepCopy to remove prototype. Otherwise these are
        //       not, in fact, equivalent objects, even though
        //       assert will claim they are
        expect(util.deepCopy(result)).to.eql({ id: 'foo' });
      });
  });

  it('should insert a batch of documents', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    });

    var docs = [];
    for (var i = 0; i < 10; i++) {
      docs.push({ num: i });
    }

    return Model.ready()
      .then(function() {
        return Model.save(docs);
      })
      .then(function(result) {
        expect(result).to.eql(docs);

        for (i = 0; i < 10; i++) {
          expect(docs[i].id).to.be.a('string');
          expect(docs[i].isSaved()).to.be.true;
        }
      });
  });

  it('should validate fields before saving', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    });

    return Model.ready()
      .then(function() {
        return Promise.all([
          expect(Model.save([{id: 4}]))
            .to.eventually.be.rejectedWith(errors.ValidationError),
          expect(Model.save([{id: 4}]))
            .to.eventually.be.rejectedWith("One of the documents is not valid. Original error:\nValue for [id] must be a string or null.")
        ]);
      });
  });

  it('should properly error if a single insert fails', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    });

    var savePromise =  Model.save([{id: '4'}])
      .then(function(result) {
        expect(result[0].id).to.equal('4');

        var docs = [];
        for (var i = 0; i < 10; i++) {
          docs.push({ num: i, id: '' + i });
        }

        return Model.save(docs);
      });

    return Model.ready()
      .then(function() {
        return expect(savePromise)
          .to.eventually.be.rejectedWith(/An error occurred during the batch insert/);
      });
  });
});

describe('Insert', function() {
  afterEach(function() { return test.dropTables(); });

  it('should generate savable copies', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      location: type.point()
    });

    return Model.ready()
      .then(function() {
        return Model.save({ id: "foo", location: [1, 2] });
      })
      .then(function(result) {
        expect(result.id).to.equal('foo');
        expect(result.location.$reql_type$).to.equal('GEOMETRY');
      });
  });

  it('should handle options (update)', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    });

    return Model.ready()
      .then(function() {
        return Model.save({ id: 'foo' });
      })
      .then(function(result) {
        expect(result.id).to.equal('foo');
        return Model.save({ id: 'foo', bar: 'buzz' }, { conflict: 'update' });
      })
      .then(function(result) {
        expect(util.deepCopy(result)).to.eql({ id: 'foo', bar: 'buzz' });
      });
  });

  it('should handle options (replace)', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    });

    return Model.ready()
      .then(function() {
        return Model.save({ id: 'foo', bar: 'buzz' });
      })
      .then(function(result) {
        expect(result.id).to.equal('foo');
        return Model.save({ id: 'foo' }, { conflict: 'replace' });
      })
      .then(function(result) {
        expect(util.deepCopy(result)).to.eql({ id: 'foo' });
      });
  });
});

describe("Joins", function() {
  var types = [ 'hasOne', 'belongsTo', 'hasMany', 'hasAndBelongsToMany'];
  types.forEach(function(type) {
    describe(type, function() {
      afterEach(function() { return test.dropTables(); });

      it('should throw if it uses a field already used by another relation', function() {
        var Model = thinky.createModel(util.s8(), { id: String }, { init: false });
        var OtherModel = thinky.createModel(util.s8(), {
          id: String,
          otherId: String
        }, {
          init: false
        });

        var AnotherModel = thinky.createModel(util.s8(), {
          id: String,
          otherId: String
        }, {
          init: false
        });

        Model[type](OtherModel, "otherDoc", "id", "otherId", { init: false });

        return Promise.all([ Model.ready(), OtherModel.ready(), AnotherModel.ready() ])
          .then(function() {
            expect(function() {
              Model[type](AnotherModel, "otherDoc", "id", "otherId");
            }).to.throw("The field `otherDoc` is already used by another relation.");
          });
      });


      it('belongsTo should throw if the first argument is not a model', function() {
        var Model = thinky.createModel(util.s8(), { id: String }, { init: false });

        return Model.ready()
          .then(function() {
            expect(function() {
              Model[type](function() {}, "otherDoc", "otherId", "id");
            }).to.throw('First argument of `' + type + '` must be a Model');
          });
      });

      it('should create an index on the other model', function() {
        var Model = thinky.createModel(util.s8(), {
          id: String,
          foreignKeyName: String
        });

        var foreignKey = util.s8();
        var schema = { id: String };
        schema[foreignKey] = String;
        var OtherModel = thinky.createModel(util.s8(), schema);

        Model[type](OtherModel, "otherDoc", "modelId", foreignKey);
        return Promise.all([ Model.ready(), OtherModel.ready() ])
          .then(function() {
            return Promise.all([
              test.r.table(OtherModel.getTableName()).indexList().run(),
              test.r.table(OtherModel.getTableName()).indexWait(foreignKey).run()
            ]);
          });
      });

      it('should throw on attempted use of _apply', function() {
        var Model = thinky.createModel(util.s8(), { id: String, notid1: String }, { init: false });
        var OtherModel = thinky.createModel(util.s8(), { id: String, notid2: String }, { init: false });

        return Promise.all([ Model.ready(), OtherModel.ready() ])
          .then(function() {
            expect(function() {
              Model[type](OtherModel, "_apply", "notid1", "notid2", { init: false });
            }).to.throw("The field `_apply` is reserved by thinky. Please use another one.");
          });
      });

    });
  });

  describe('hasOne', function() {
    afterEach(function() { return test.dropTables(); });

    it('should save the join', function() {
      var Model = thinky.createModel(util.s8(), { id: String });
      var OtherModel = thinky.createModel(util.s8(), { id: String, otherId: String });
      Model.hasOne(OtherModel, "otherDoc", "id", "otherId");

      return Promise.all([ Model.ready(), OtherModel.ready() ])
        .then(function() {
          expect(Model._getModel()._joins.otherDoc).to.exist;
        });
    });

  });

  describe('hasAndBelongsToMany', function() {
    afterEach(function() { return test.dropTables(); });

    it('should create an index on this table', function() {
      var Model = thinky.createModel(util.s8(), { id: String, notid1: String });
      var OtherModel = thinky.createModel(util.s8(), { id: String, notid2: String });

      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "notid1", "notid2");

      var linkName;
      if (Model.getTableName() < OtherModel.getTableName()) {
        linkName = Model.getTableName() + "_" + OtherModel.getTableName();
      } else {
        linkName = OtherModel.getTableName() + "_" + Model.getTableName();
      }

      return Promise.all([ Model.ready(), OtherModel.ready() ])
        .then(function() {
          return Promise.all([
            test.r.table(Model.getTableName()).indexList().run(),
            test.r.table(Model.getTableName()).indexWait("notid1").run()
          ]);
        });
    });

    it('should create an index on the joined table', function() {
      var Model = thinky.createModel(util.s8(), { id: String, notid1: String });
      var OtherModel = thinky.createModel(util.s8(), { id: String, notid2: String });

      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "notid1", "notid2");

      var linkName;
      if (Model.getTableName() < OtherModel.getTableName()) {
        linkName = Model.getTableName() + "_" + OtherModel.getTableName();
      } else {
        linkName = OtherModel.getTableName() + "_" + Model.getTableName();
      }

      return Promise.all([ Model.ready(), OtherModel.ready() ])
        .then(function() {
          return Promise.all([
            test.r.table(OtherModel.getTableName()).indexList().run(),
            test.r.table(OtherModel.getTableName()).indexWait("notid2").run()
          ]);
        });
    });

    it('should create a linked table with indexes', function() {
      var Model = thinky.createModel(util.s8(), { id: String, notid1: String });
      var OtherModel = thinky.createModel(util.s8(), { id: String, notid2: String });

      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "notid1", "notid2");

      var linkName;
      if (Model.getTableName() < OtherModel.getTableName()) {
        linkName = Model.getTableName() + "_" + OtherModel.getTableName();
      } else {
        linkName = OtherModel.getTableName() + "_" + Model.getTableName();
      }

      return Promise.all([ Model.ready(), OtherModel.ready() ])
        .then(function() {
          return Promise.all([
            test.r.table(linkName).indexList().run(),
            test.r.table(OtherModel.getTableName()).indexWait("notid2").run()
          ]);
        });
    });
  });
});

describe('define', function() {
  it('should be able to define a document method', function(done) {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    }, {
      init: false
    });

    Model.define('foo', function() { done(); });
    var doc = new Model({});
    doc.foo();
  });

  it('this should refer to the document', function(done) {
    var str = util.s8();
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    }, {
      init: false
    });

    Model.define('foo', function() {
      expect(this.id).to.equal(str);
      done();
    });

    var doc = new Model({id: str});
    doc.foo();
  });
});

describe('static', function() {
  afterEach(function() { return test.dropTables(); });

  it('should add a static method to the model', function(done) {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    }, {
      init: false
    });

    Model.defineStatic('foo', function() { done(); });
    Model.foo();
  });

  it('this should refer to the model', function(done) {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number
    }, {
      init: false
    });

    Model.defineStatic('foo', function() { this.bar(); });
    Model.defineStatic('bar', function() { done(); });
    Model.foo();
  });

  it('should add static method to model queries', function() {
    var Model = thinky.createModel(util.s8(), { id: String });
    var Other = thinky.createModel(util.s8(), { id: String });

    Model.hasOne(Other, 'other', 'id', 'modelId');
    Other.belongsTo(Model, 'model', 'modelId', 'id');

    Other.defineStatic('foo', function() {
      return this.merge({ bar: true });
    });

    var doc1 = new Model({});
    var doc2 = new Other({ model: doc1 });

    return Promise.all([ Model.ready(), Other.ready() ])
      .then(function() {
        return doc2.saveAll();
      })
      .then(function() {
        return Model.getJoin({
          other: {
            _apply: function(query) {
              return query.foo();
            }
          }
        }).run();
      }).then(function(docs) {
        expect(docs[0].other.bar).to.be.true;
      });
  });
});

describe('ensureIndex', function() {
  afterEach(function() { return test.dropTables(); });

  it('should add and ensure an index', function() {
    var Model = thinky.createModel(util.s8(), { id: String, num: Number });
    return Model.ready()
      .then(function() {
        return Model.ensureIndex("num");
      })
      .then(function() {
        var doc = new Model({ num: 42 });
        return doc.save();
      })
      .then(function(result) {
        return Model.orderBy({ index: "num" }).run();
      })
      .then(function(result) {
        expect(result[0].num).to.equal(42);
      });
  });

  it('should add an index with multi', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      nums: [ Number ]
    });


    return Model.ready()
      .then(function() {
        return Model.ensureIndex('nums', function(doc) {
          return doc("nums");
        }, {
          multi: true
        });
      })
      .then(function() {
        var doc = new Model({ nums: [1,2,3] });
        return doc.save();
      })
      .then(function(result) {
        return Model.getAll(1, { index: 'nums' }).run();
      })
      .then(function(result) {
        expect(result).to.have.length(1);
        return Model.getAll(2, { index: 'nums' }).run();
      })
      .then(function(result) {
        expect(result).to.have.length(1);
      });
  });

  it('should accept index options', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      location: type.point()
    });

    return Model.ready()
      .then(function() {
        return Model.ensureIndex("location", { geo: true });
      })
      .then(function() {
        var doc = new Model({location: [1,2]});
        return doc.save();
      })
      .then(function(result) {
        return Model.getIntersecting(test.r.circle([1,2], 1), { index: 'location' }).run();
      })
      .then(function(result) {
        expect(result).to.have.length(1);
        return Model.getIntersecting(test.r.circle([3,2], 1), { index: 'location' }).run();
      })
      .then(function(result) {
        expect(result).to.have.length(0);
      });
  });
});

describe('virtual', function() {
  afterEach(function() { return test.dropTables(); });

  it('should pass schema validation', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual'
      }
    }, { init: false });
  });

  it('should generate fields', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num + 2;
        }
      }
    }, { init: false });

    var doc = new Model({ num: 1 });
    expect(doc.numVirtual).to.equal(3);
  });

  it('should generate fields (manually)', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num + 2;
        }
      }
    }, { init: false });

    var doc = new Model({ num: 1 });
    expect(doc.numVirtual).to.equal(3);

    doc.num = 2;
    expect(doc.numVirtual).to.equal(3);

    doc.generateVirtualValues();
    expect(doc.numVirtual).to.equal(4);
  });

  it('should validate fields', function() {
    var Model = thinky.createModel(util.s8(), {
      id: String,
      num: Number,
      numVirtual: {
        _type: 'virtual'
      }
    }, { init: false });

    var doc = new Model({ num: 1 });
    return doc.validate();
  });

  it('should not save virtual fields', function() {
    var Model = thinky.createModel(util.s8(), {
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
    });

    return Model.ready()
      .then(function() {
        return doc.save();
      })
      .then(function(result) {
        return Model.get(1).execute();
      })
      .then(function(result) {
        expect(result.numVirtual).to.be.undefined;
      });
  });

  it('should not save virtual fields, but regenerate on retrieval', function() {
    var Model = thinky.createModel(util.s8(), {
      id: Number,
      num: Number,
      numVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num + 2;
        }
      }
    });

    var doc = new Model({
      id: 1,
      num: 1
    });

    expect(doc.numVirtual).to.equal(3);
    return Model.ready()
      .then(function() {
        return doc.save();
      })
      .then(function(result) {
        expect(result.numVirtual).to.equal(3);
        return Model.get(1).execute();
      })
      .then(function(result) {
        expect(result.numVirtual).to.be.undefined;
        return Model.get(1).run();
      })
      .then(function(result) {
        expect(result.numVirtual).to.equal(3);
      });
  });

  it('should not save virtual fields, but should revert them (if no default)', function() {
    var Model = thinky.createModel(util.s8(), {
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
    });

    return Model.ready()
      .then(function() {
        return doc.save();
      })
      .then(function(result) {
        expect(result.numVirtual).to.equal(10);
        return Model.get(1).execute();
      })
      .then(function(result) {
        expect(result.numVirtual).to.be.undefined;
      });
  });

  it('should be generated after other default values', function() {
    var Model = thinky.createModel(util.s8(), {
      id: Number,
      anumVirtual: {
        _type: 'virtual',
        default: function() {
          return this.num + 1;
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
          return this.num + 1;
        }
      }
    }, { init: false });

    var doc = new Model({ id: 1 });
    expect(doc.numVirtual).to.equal(3);
    expect(doc.anumVirtual).to.equal(3);
  });

  it('should be not be generated if a parent is undefined', function() {
    var Model = thinky.createModel(util.s8(), {
      id: Number,
      nested: {
        field: {
          _type: "virtual",
          default: function() {
            return 3;
          }
        }
      }
    }, { init: false });

    var doc = new Model({ id: 1 });
    doc.generateVirtualValues();
    expect(doc.nested).to.be.undefined;
  });

  it('should not throw if a parent has the wrong type', function() {
    var Model = thinky.createModel(util.s8(), {
      id: Number,
      ar: type.array().schema({
        num: type.number().default(3)
      }).options({enforce_type: "none"})
    }, { init: false });

    var doc = new Model({ id: 1, ar: 3 });
    doc._generateDefault();
    expect(doc.ar).to.equal(3);
  });
});
