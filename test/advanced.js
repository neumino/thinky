var config = require(__dirname+'/../config.js');

var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;
var type = thinky.type;

var util = require(__dirname+'/util.js');
var assert = require('assert');
var Promise = require('bluebird');
var Errors = thinky.Errors;


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



describe('Advanced cases', function(){
  describe('saveAll', function(){
    afterEach(cleanTables);

    it('hasOne - belongsTo', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;

      doc.saveAll().then(function(result) {
        assert.strictEqual(doc, result);
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.has.id, 'string')
        assert.equal(result.id, result.has.otherId)

        assert.strictEqual(result, doc);
        assert.strictEqual(result.has, doc.has);
        assert.strictEqual(doc.has, otherDoc);

        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.id, doc.id)
          assert.equal(result.has.id, doc.has.id)
          assert.equal(result.has.otherId, doc.has.otherId)
          OtherModel.get(otherDoc.id).getJoin().run().then(function(result) {
            assert.equal(result.id, otherDoc.id);
            assert.equal(result.belongsTo.id, doc.id);
            done()
          })
        });
      }).error(done);
    });
    it('hasOne - belongsTo', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.has.id, 'string')
        assert.equal(result.id, result.has.otherId)

        assert.strictEqual(result, doc);
        assert.strictEqual(result.has, doc.has);
        assert.strictEqual(doc.has, otherDoc);

        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.id, doc.id)
          assert.equal(result.has.id, doc.has.id)
          assert.equal(result.has.otherId, doc.has.otherId)
          OtherModel.get(otherDoc.id).getJoin().run().then(function(result) {
            assert.equal(result.id, otherDoc.id);
            assert.equal(result.belongsTo.id, doc.id);
            done()
          })
        });
      }).error(done);
    });
    it('belongsTo - hasOne', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var otherName = util.s8();
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      otherDoc.belongsTo = doc;

      otherDoc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.belongsTo.id, 'string')
        assert.equal(result.otherId, result.belongsTo.id)

        assert.strictEqual(result, otherDoc);
        assert.strictEqual(result.belongsTo, otherDoc.belongsTo);
        assert.strictEqual(otherDoc.belongsTo, doc);

        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.id, doc.id)
          assert.equal(result.has.id, otherDoc.id)
          assert.equal(result.has.otherId, otherDoc.otherId)
          OtherModel.get(otherDoc.id).getJoin().run().then(function(result) {
            assert.equal(result.id, otherDoc.id);
            assert.equal(result.belongsTo.id, doc.id);
            done()
          })
        });
      }).error(done);
    });
    it('belongsTo - hasOne -- circular references', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      otherDoc.belongsTo = doc;
      doc.has = otherDoc;

      otherDoc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.belongsTo.id, 'string')
        assert.equal(result.otherId, result.belongsTo.id)

        assert.strictEqual(result, otherDoc);
        assert.strictEqual(result.belongsTo, otherDoc.belongsTo);
        assert.strictEqual(otherDoc.belongsTo, doc);

        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.id, doc.id)
          assert.equal(result.has.id, otherDoc.id)
          assert.equal(result.has.otherId, otherDoc.otherId)
          OtherModel.get(otherDoc.id).getJoin().run().then(function(result) {
            assert.equal(result.id, otherDoc.id);
            assert.equal(result.belongsTo.id, doc.id);
            done()
          })
        });
      }).error(done);
    });
    it('hasMany - belongsTo', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string');
        assert.equal(result.has.length, 3);
        for(var i=0; i<result.has.length; i++) {
          assert.equal(typeof result.has[i].id, 'string')
          assert.equal(result.has[i].otherId, result.id)
        }

        assert.strictEqual(result, doc);
        for(var i=0; i<result.has.length; i++) {
          assert.strictEqual(result.has[i], doc.has[i]);
        }
        assert.strictEqual(doc.has, otherDocs);

        util.sortById(otherDocs);
        Model.get(doc.id).getJoin({
          has: {
            _apply: function(sequence) {
              return sequence.orderBy('id');
            }
          }}).run().then(function(result) {

          assert.equal(result.id, doc.id);
          assert.equal(result.has[0].id, doc.has[0].id);
          assert.equal(result.has[1].id, doc.has[1].id);
          assert.equal(result.has[2].id, doc.has[2].id);

          assert.equal(result.has[0].otherId, result.id);
          assert.equal(result.has[1].otherId, result.id);
          assert.equal(result.has[2].otherId, result.id);

          OtherModel.run().then(function(result) {
            assert.equal(result.length, 3);
            done()
          })
        });
      }).error(done);
    });
    it('hasMany - belongsTo - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      values.has = otherDocs;
      var doc = new Model(values);

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string');
        assert.equal(result.has.length, 3);
        for(var i=0; i<result.has.length; i++) {
          assert.equal(typeof result.has[i].id, 'string')
          assert.equal(result.has[i].otherId, result.id)
        }

        assert.strictEqual(result, doc);
        for(var i=0; i<result.has.length; i++) {
          assert.strictEqual(result.has[i], doc.has[i]);
        }
        assert.strictEqual(doc.has, otherDocs);

        util.sortById(otherDocs);
        Model.get(doc.id).getJoin({
          has: {
            _apply: function(sequence) {
              return sequence.orderBy('id');
            }
          }}).run().then(function(result) {

          assert.equal(result.id, doc.id);
          assert.equal(result.has[0].id, doc.has[0].id);
          assert.equal(result.has[1].id, doc.has[1].id);
          assert.equal(result.has[2].id, doc.has[2].id);

          assert.equal(result.has[0].otherId, result.id);
          assert.equal(result.has[1].otherId, result.id);
          assert.equal(result.has[2].otherId, result.id);

          OtherModel.run().then(function(result) {
            assert.equal(result.length, 3);
            done()
          })
        });
      }).error(done);
    })
    it('hasMany - belongsTo', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string');
        assert.equal(result.has.length, 3);
        for(var i=0; i<result.has.length; i++) {
          assert.equal(typeof result.has[i].id, 'string')
          assert.equal(result.has[i].otherId, result.id)
        }

        assert.strictEqual(result, doc);
        for(var i=0; i<result.has.length; i++) {
          assert.strictEqual(result.has[i], doc.has[i]);
        }
        assert.strictEqual(doc.has, otherDocs);

        util.sortById(otherDocs);
        Model.get(doc.id).getJoin({has: { _apply: function(seq) {
          return seq.orderBy('id');
        }}}).run().then(function(result) {
          assert.equal(result.id, doc.id);
          assert.equal(result.has[0].id, doc.has[0].id);
          assert.equal(result.has[1].id, doc.has[1].id);
          assert.equal(result.has[2].id, doc.has[2].id);

          assert.equal(result.has[0].otherId, result.id);
          assert.equal(result.has[1].otherId, result.id);
          assert.equal(result.has[2].otherId, result.id);

          OtherModel.getAll(doc.id, {index: "otherId"}).getJoin().run().then(function(result) {
            assert.equal(result.length, 3);
            done()
          })
        });
      }).error(done);
    });
    it('belongsTo - hasMany -- circular references', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      otherDocs[0].saveAll().then(function(result) {
        assert.equal(typeof otherDocs[0].id, 'string');
        assert.equal(otherDocs[0].belongsTo.id, doc.id);

        otherDocs[1].saveAll().then(function(result) {
          assert.equal(typeof otherDocs[1].id, 'string');
          assert.equal(otherDocs[1].belongsTo.id, doc.id);

          otherDocs[2].saveAll().then(function(result) {
            assert.equal(typeof otherDocs[2].id, 'string');
            assert.equal(otherDocs[2].belongsTo.id, doc.id);

            util.sortById(otherDocs);
            Model.get(doc.id).getJoin({has: { _apply: function(seq) {
              return seq.orderBy('id')
            }}}).run().then(function(result) {
              assert.equal(result.id, doc.id);
              assert.equal(result.has[0].id, doc.has[0].id);
              assert.equal(result.has[1].id, doc.has[1].id);
              assert.equal(result.has[2].id, doc.has[2].id);

              assert.equal(result.has[0].otherId, result.id);
              assert.equal(result.has[1].otherId, result.id);
              assert.equal(result.has[2].otherId, result.id);

              OtherModel.getAll(doc.id, {index: "otherId"}).getJoin().run().then(function(result) {
                assert.equal(result.length, 3);
                done()
              })
            });
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model(values);
      var doc2 = new Model(otherValues);
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        doc2.saveAll().then(function(result) {
          util.sortById(doc2.links);
          Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
            return seq.orderBy('id')
          }}}).run().then(function(result) {

            assert.equal(result.id, doc1.id);
            assert.equal(result.links[0].id, doc1.links[0].id);
            assert.equal(result.links[1].id, doc1.links[1].id);
            assert.equal(result.links[2].id, doc1.links[2].id);
            Model.get(doc2.id).getJoin({links: { _apply: function(seq) {
              return seq.orderBy('id');
            }}}).run().then(function(result) {
              assert.equal(result.id, doc2.id);
              assert.equal(result.links[0].id, doc2.links[0].id);
              assert.equal(result.links[1].id, doc2.links[1].id);
              assert.equal(result.links[2].id, doc2.links[2].id);
              done()
            })
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      values.links = [otherDoc1, otherDoc2, otherDoc4]
      otherValues.links = [otherDoc2, otherDoc3, otherDoc4]
      var doc1 = new Model(values);
      var doc2 = new Model(otherValues);


      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        doc2.saveAll().then(function(result) {
          util.sortById(doc2.links);
          Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
            return seq.orderBy('id')
          }}}).run().then(function(result) {

            assert.equal(result.id, doc1.id);
            assert.equal(result.links[0].id, doc1.links[0].id);
            assert.equal(result.links[1].id, doc1.links[1].id);
            assert.equal(result.links[2].id, doc1.links[2].id);
            Model.get(doc2.id).getJoin({links: { _apply: function(seq) {
              return seq.orderBy('id');
            }}}).run().then(function(result) {
              assert.equal(result.id, doc2.id);
              assert.equal(result.links[0].id, doc2.links[0].id);
              assert.equal(result.links[1].id, doc2.links[1].id);
              assert.equal(result.links[2].id, doc2.links[2].id);
              done()
            })
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- multiple saves', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      values.links = [otherDoc1]
      var doc1 = new Model(values);


      doc1.saveAll().then(function(result) {
        doc1.links.push(otherDoc2);
        doc1.links.push(otherDoc3);
        doc1.links.push(otherDoc4);
        doc1.saveAll().then(function(result) {
          Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
            return seq.orderBy('id')
          }}}).run().then(function(result) {
            util.sortById(doc1.links);
            assert.equal(result.id, doc1.id);
            assert.equal(result.links[0].id, doc1.links[0].id);
            assert.equal(result.links[1].id, doc1.links[1].id);
            assert.equal(result.links[2].id, doc1.links[2].id);
            assert.equal(result.links[3].id, doc1.links[3].id);
            OtherModel.count().execute().then(function(result) {
              assert.equal(result, 4);
              thinky.models[Model._joins.links.link].count().execute().then(function(result) {
                assert.equal(result, 4);
                done()
              });
            });
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- partial delete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      values.links = [otherDoc1, otherDoc2, otherDoc3, otherDoc4]
      var doc1 = new Model(values);


      doc1.saveAll().then(function(result) {
        var removedOtherDocs = doc1.links.slice(2);
        doc1.links = doc1.links.slice(0, 2);
        doc1.saveAll().then(function(result) {
          Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
            return seq.orderBy('id')
          }}}).run().then(function(result) {
            util.sortById(doc1.links);
            assert.equal(result.id, doc1.id);
            assert.equal(result.links[0].id, doc1.links[0].id);
            assert.equal(result.links[1].id, doc1.links[1].id);
            OtherModel.count().execute().then(function(result) {
              assert.equal(result, 4);
              thinky.models[Model._joins.links.link].count().execute().then(function(result) {
                assert.equal(result, 2);

                doc1.links.push.apply(doc1.links, removedOtherDocs);
                doc1.saveAll().then(function(result) {
                  OtherModel.count().execute().then(function(result) {
                    assert.equal(result, 4);
                    thinky.models[Model._joins.links.link].count().execute().then(function(result) {
                      assert.equal(result, 2);
                      done()
                    });
                  });
                });
              });
            });
          });
        });
      }).error(done);
    });

    it('hasAndBelongsToMany -- primary keys -- circular references', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");

      OtherModel.hasAndBelongsToMany(Model, "links2", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]
      otherDoc1.links2 = [doc1];
      otherDoc2.links2 = [doc1, doc2];
      otherDoc3.links2 = [doc2];
      otherDoc4.links2 = [doc1, doc2];

      doc1.saveAll().then(function(result) {
        // All docs are saved
        assert.equal(doc1.isSaved(), true);
        assert.equal(doc1.links[0].isSaved(), true);
        assert.equal(doc1.links[1].isSaved(), true);
        assert.equal(doc1.links[2].isSaved(), true);
        assert.strictEqual(doc1, result);

        // All saved docs have an id
        assert.equal(typeof doc1.id, 'string');
        assert.equal(typeof doc1.links[0].id, 'string');
        assert.equal(typeof doc1.links[1].id, 'string');
        assert.equal(typeof doc1.links[2].id, 'string');
        util.sortById(doc1.links);

        doc2.saveAll().then(function(result) {
          // All docs are saved
          assert.equal(doc2.isSaved(), true);
          assert.equal(doc2.links[0].isSaved(), true);
          assert.equal(doc2.links[1].isSaved(), true);
          assert.equal(doc2.links[2].isSaved(), true);
          assert.strictEqual(doc2, result);

          // All saved docs have an id
          assert.equal(typeof doc2.id, 'string');
          assert.equal(typeof doc2.links[0].id, 'string');
          assert.equal(typeof doc2.links[1].id, 'string');
          assert.equal(typeof doc2.links[2].id, 'string');
          util.sortById(doc2.links);

          util.sortById(doc2.links);

          // doc1 and doc2 share two common links
          var map = {}
          for(var i=0; i<doc1.links.length; i++) {
            map[doc1.links[i].id] = true
          }
          var count = 0;
          for(var i=0; i<doc2.links.length; i++) {
            if (map[doc2.links[i].id] != true) {
              count++;
            }
          }
          assert(count,2);

          util.sortById(otherDoc1.links2);
          util.sortById(otherDoc2.links2);
          util.sortById(otherDoc3.links2);
          util.sortById(otherDoc4.links2);

          Model.get(doc1.id).getJoin({links: {
            _apply: function(seq) {
              return seq.orderBy('id');
            }
          }}).run().then(function(result) {
            assert.equal(result.id, doc1.id);
            assert.equal(result.links[0].id, doc1.links[0].id);
            assert.equal(result.links[1].id, doc1.links[1].id);
            assert.equal(result.links[2].id, doc1.links[2].id);
            Model.get(doc2.id).getJoin({links: {
              _apply: function(seq) {
                return seq.orderBy('id');
              }
            }}).run().then(function(result) {

              assert.equal(result.id, doc2.id);
              assert.equal(result.links[0].id, doc2.links[0].id);
              assert.equal(result.links[1].id, doc2.links[1].id);
              assert.equal(result.links[2].id, doc2.links[2].id);
              OtherModel.get(otherDoc1.id).getJoin().run().then(function(result) {
                assert.equal(result.id, otherDoc1.id);
                assert.equal(result.links2[0].id, otherDoc1.links2[0].id)
                OtherModel.get(otherDoc2.id).getJoin({links2: {
                  _apply: function(seq) {
                    return seq.orderBy('id');
                  }
                }}).run().then(function(result) {

                  assert.equal(result.id, otherDoc2.id);
                  assert.equal(result.links2[0].id, otherDoc2.links2[0].id)
                  assert.equal(result.links2[1].id, otherDoc2.links2[1].id)
                  OtherModel.get(otherDoc3.id).getJoin({links2: {
                    _apply: function(seq) {
                      return seq.orderBy('id');
                    }
                  }}).run().then(function(result) {
                    assert.equal(result.id, otherDoc3.id);
                    assert.equal(result.links2[0].id, otherDoc3.links2[0].id)
                    OtherModel.get(otherDoc4.id).getJoin({links2: {
                      _apply: function(seq) {
                        return seq.orderBy('id');
                      }
                    }}).run().then(function(result) {
                      assert.equal(result.id, otherDoc4.id);
                      assert.equal(result.links2[0].id, otherDoc4.links2[0].id)
                      assert.equal(result.links2[1].id, otherDoc4.links2[1].id)
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      }).error(done);
    });
  });
  describe('deleteAll', function(){
    afterEach(cleanTables);

    it('hasOne - belongsTo -- no arg', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var otherName = util.s8();
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.has.id, 'string')
        assert.equal(result.id, result.has.otherId)

        assert.strictEqual(result, doc);
        assert.strictEqual(result.has, doc.has);
        assert.strictEqual(doc.has, otherDoc);

        doc.deleteAll().then(function(result) {

          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.get(otherDoc.id).run().error(function(error) {
              assert(error instanceof Errors.DocumentNotFound);
              done()
            });
          });
        });
      }).error(done);
    });
    it('hasOne - belongsTo -- with modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.has.id, 'string')
        assert.equal(result.id, result.has.otherId)

        assert.strictEqual(result, doc);
        assert.strictEqual(result.has, doc.has);
        assert.strictEqual(doc.has, otherDoc);

        doc.deleteAll({has: true}).then(function(result) {
          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.get(otherDoc.id).run().error(function(error) {
              assert(error instanceof Errors.DocumentNotFound);
              done()
            });
          });
        });
      }).error(done);
    });
    it('hasOne - belongsTo -- with empty modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.has.id, 'string')
        assert.equal(result.id, result.has.otherId)

        assert.strictEqual(result, doc);
        assert.strictEqual(result.has, doc.has);
        assert.strictEqual(doc.has, otherDoc);

        doc.deleteAll({}).then(function(result) {
          return Model.get(doc.id).run()
        }).error(function(error) {
          assert(error instanceof Errors.DocumentNotFound);
          return OtherModel.get(otherDoc.id).run();
        }).then(function(result) {
          assert.equal(result.id, otherDoc.id);
          done()
        });
      }).error(done);
    });
    it('hasOne - belongsTo -- with non matching modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.has.id, 'string')
        assert.equal(result.id, result.has.otherId)

        assert.strictEqual(result, doc);
        assert.strictEqual(result.has, doc.has);
        assert.strictEqual(doc.has, otherDoc);

        doc.deleteAll({foo: {bar: true}}).then(function(result) {
          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.get(otherDoc.id).run().then(function(result) {
              assert.equal(result.id, otherDoc.id);
              done()
            });
          });
        });
      }).error(done);
    });
    it('belongsTo - hasOne -- with no arg', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var otherName = util.s8();
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      otherDoc.belongsTo = doc;
      doc.has = otherDoc;

      otherDoc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.belongsTo.id, 'string')
        assert.equal(result.otherId, result.belongsTo.id)

        assert.strictEqual(result, otherDoc);
        assert.strictEqual(result.belongsTo, otherDoc.belongsTo);
        assert.strictEqual(otherDoc.belongsTo, doc);

        return otherDoc.deleteAll();
      }).error(done).then(function(result) {
        return Model.get(doc.id).run()
      }).error(function(error) {
        assert(error instanceof Errors.DocumentNotFound);
        OtherModel.get(otherDoc.id).run().then(function(result) {
          done(new Error("Was expecting the document to be deleted"));
        }).error(function(error) {
          assert(error instanceof Errors.DocumentNotFound);
          done()
        });
      }).error(done);
    });
    it('belongsTo - hasOne -- with modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      otherDoc.belongsTo = doc;
      doc.has = otherDoc;

      otherDoc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.belongsTo.id, 'string')
        assert.equal(result.otherId, result.belongsTo.id)

        assert.strictEqual(result, otherDoc);
        assert.strictEqual(result.belongsTo, otherDoc.belongsTo);
        assert.strictEqual(otherDoc.belongsTo, doc);

        otherDoc.deleteAll({belongsTo: true}).then(function(result) {
          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.get(otherDoc.id).run().error(function(error) {
              assert(error instanceof Errors.DocumentNotFound);
              done()
            });
          });
        });
      }).error(done);
    });
    it('belongsTo - hasOne -- with empty modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      otherDoc.belongsTo = doc;
      doc.has = otherDoc;

      otherDoc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string')
        assert.equal(typeof result.belongsTo.id, 'string')
        assert.equal(result.otherId, result.belongsTo.id)

        assert.strictEqual(result, otherDoc);
        assert.strictEqual(result.belongsTo, otherDoc.belongsTo);
        assert.strictEqual(otherDoc.belongsTo, doc);

        otherDoc.deleteAll({}).then(function(result) {
          Model.get(doc.id).run().then(function(result) {
            assert.equal(result.id, doc.id);
            OtherModel.get(otherDoc.id).run().error(function(error) {
              assert(error instanceof Errors.DocumentNotFound);
              done()
            });
          });
        });
      }).error(done);
    });

    it('hasMany - belongsTo', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string');
        assert.equal(result.has.length, 3);
        for(var i=0; i<result.has.length; i++) {
          assert.equal(otherDocs[i].isSaved(), true);
          assert.equal(typeof result.has[i].id, 'string');
          assert.equal(result.has[i].otherId, result.id);
        }

        assert.strictEqual(result, doc);
        for(var i=0; i<result.has.length; i++) {
          assert.strictEqual(result.has[i], doc.has[i]);
        }
        assert.strictEqual(doc.has, otherDocs);

        util.sortById(otherDocs);
        doc.deleteAll().then(function(result) {
          assert.equal(otherDocs[0].isSaved(), false);
          assert.equal(otherDocs[1].isSaved(), false);
          assert.equal(otherDocs[2].isSaved(), false);

          assert.equal(doc.isSaved(), false);

          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.getAll(doc.id, {index: "otherId"}).run().then(function(result) {
              assert.equal(result.length, 0);
              done()
            });
          });
        });
      }).error(done);
    });
    it('hasMany - belongsTo -- empty modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string');
        assert.equal(result.has.length, 3);
        for(var i=0; i<result.has.length; i++) {
          assert.equal(typeof result.has[i].id, 'string')
          assert.equal(result.has[i].otherId, result.id)
        }

        assert.strictEqual(result, doc);
        for(var i=0; i<result.has.length; i++) {
          assert.strictEqual(result.has[i], doc.has[i]);
        }
        assert.strictEqual(doc.has, otherDocs);

        util.sortById(otherDocs);

        doc.deleteAll({}).then(function(result) {
          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id, {index: "id"}).run().then(function(result) {
              assert.equal(result.length, 3);
              OtherModel.getAll(doc.id, {index: "otherId"}).run().then(function(result) {
                assert.equal(result.length, 0);
                done()
              });
            });
          });
        });

      }).error(done);
    });
    it('hasMany - belongsTo -- good modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string');
        assert.equal(result.has.length, 3);
        for(var i=0; i<result.has.length; i++) {
          assert.equal(typeof result.has[i].id, 'string')
          assert.equal(result.has[i].otherId, result.id)
        }

        assert.strictEqual(result, doc);
        for(var i=0; i<result.has.length; i++) {
          assert.strictEqual(result.has[i], doc.has[i]);
        }
        assert.strictEqual(doc.has, otherDocs);

        util.sortById(otherDocs);

        doc.deleteAll({has: true}).then(function(result) {
          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id, {index: "id"}).run().then(function(result) {
              assert.equal(result.length, 0);
              OtherModel.getAll(doc.id, {index: "otherId"}).run().then(function(result) {
                assert.equal(result.length, 0);
                done()
              });
            });


          });
        });

      }).error(done);
    });
    it('hasMany - belongsTo -- non matching modelToDelete', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        assert.equal(typeof result.id, 'string');
        assert.equal(result.has.length, 3);
        for(var i=0; i<result.has.length; i++) {
          assert.equal(typeof result.has[i].id, 'string')
          assert.equal(result.has[i].otherId, result.id)
        }

        assert.strictEqual(result, doc);
        for(var i=0; i<result.has.length; i++) {
          assert.strictEqual(result.has[i], doc.has[i]);
        }
        assert.strictEqual(doc.has, otherDocs);

        util.sortById(otherDocs);

        doc.deleteAll({foo: true}).then(function(result) {
          Model.get(doc.id).run().error(function(error) {
            assert(error instanceof Errors.DocumentNotFound);
            OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id, {index: "id"}).run().then(function(result) {
              assert.equal(result.length, 3);
              OtherModel.getAll(doc.id, {index: "otherId"}).run().then(function(result) {
                assert.equal(result.length, 0);
                done()
              });
            });

          });
        });

      }).error(done);
    });
    it('belongsTo - hasMany -- circular references', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc1 = new OtherModel(values);
      var otherDoc2 = new OtherModel(values);
      var otherDoc3 = new OtherModel(values);
      var otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.has = otherDocs;
      otherDoc1.belongsTo = doc;
      otherDoc2.belongsTo = doc;
      otherDoc3.belongsTo = doc;

      doc.saveAll().then(function(result) {
        return otherDoc1.deleteAll()
      }).then(function(result) {
        assert.equal(otherDocs.length, 2);
        assert.equal(otherDoc1.isSaved(), false);
        assert.equal(doc.isSaved(), false);
        assert.equal(otherDoc2.isSaved(), false);
        assert.equal(otherDoc3.isSaved(), false);
        return OtherModel.count().execute()
      }).then(function(result) {
        assert.equal(result, 0);
        done();
      }).catch(done).error(done);
    });
    it('belongsTo - hasMany -- must manually overwrite', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc0 = new OtherModel(otherValues);
      var otherDoc1 = new OtherModel(otherValues);
      var otherDoc2 = new OtherModel(otherValues);
      var otherDocs = [otherDoc0, otherDoc1, otherDoc2];

      doc.has = otherDocs;
      otherDoc0.belongsTo = doc;
      otherDoc1.belongsTo = doc;
      otherDoc2.belongsTo = doc;

      doc.saveAll().then(function(result) {
        otherDoc0.deleteAll({belongsTo: {has: true}}).then(function(result) {
          assert.equal(otherDoc0.isSaved(), false);
          assert.equal(doc.isSaved(), false);
          assert.equal(otherDoc1.isSaved(), false);
          assert.equal(otherDoc2.isSaved(), false);
          OtherModel.count().execute().then(function(result) {
            assert.equal(result, 0);
            done();
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        return doc2.saveAll();
      }).then(function(result) {
        util.sortById(doc2.links);
        return doc1.deleteAll();
      }).then(function(result) {
        assert.equal(doc1.isSaved(), false)
        assert.equal(doc2.isSaved(), true)
        assert.equal(otherDoc1.isSaved(), false);
        assert.equal(otherDoc2.isSaved(), false);
        assert.equal(otherDoc4.isSaved(), false);
        assert.equal(otherDoc3.isSaved(), true);
        done();
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys -- bidirectional - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links2", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      otherDoc1.links2 = [doc1];
      otherDoc2.links2 = [doc1, doc2];
      otherDoc3.links2 = [doc2];
      otherDoc4.links2 = [doc1, doc2];

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        return doc2.saveAll();
      }).then(function(result) {
        util.sortById(doc2.links);

        return doc1.deleteAll({links: {links2: true}});
      }).then(function(result) {
        assert.equal(doc1.isSaved(), false)
        assert.equal(otherDoc1.isSaved(), false);
        assert.equal(otherDoc2.isSaved(), false);
        assert.equal(otherDoc4.isSaved(), false);
        assert.equal(otherDoc3.isSaved(), true);

        assert.equal(doc2.isSaved(), false)
        done();
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys -- bidirectional - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links2", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      otherDoc1.links2 = [doc1];
      otherDoc2.links2 = [doc1, doc2];
      otherDoc3.links2 = [doc2];
      otherDoc4.links2 = [doc1, doc2];

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        return doc2.saveAll();
      }).then(function(result) {
        util.sortById(doc2.links);

        return otherDoc4.deleteAll({links2: {links: true}});
      }).then(function(result) {
        assert.equal(doc1.isSaved(), false)
        assert.equal(doc2.isSaved(), false)
        assert.equal(otherDoc1.isSaved(), false);
        assert.equal(otherDoc2.isSaved(), false);
        assert.equal(otherDoc3.isSaved(), false);
        assert.equal(otherDoc4.isSaved(), false);

        done();
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys -- bidirectional - 3', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links2", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      otherDoc1.links2 = [doc1];
      otherDoc2.links2 = [doc1, doc2];
      otherDoc3.links2 = [doc2];
      otherDoc4.links2 = [doc1, doc2];

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        return doc2.saveAll();
      }).then(function(result) {
        util.sortById(doc2.links);

        return otherDoc4.deleteAll();
      }).then(function(result) {
        assert.equal(doc1.isSaved(), false)
        assert.equal(doc2.isSaved(), false)
        assert.equal(otherDoc1.isSaved(), false);
        assert.equal(otherDoc2.isSaved(), false);
        assert.equal(otherDoc3.isSaved(), false);
        assert.equal(otherDoc4.isSaved(), false);

        done();
      }).error(done);
    });
    it('hasAndBelongsToMany -- not primary keys - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        field1: Number
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        field2: Number
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "field1", "field2");
      OtherModel.hasAndBelongsToMany(Model, "links2", "field2", "field1:");

      var doc1 = new Model({field1: 1});
      var doc2 = new Model({field1: 2});
      var otherDoc1 = new OtherModel({field2: 2});
      var otherDoc2 = new OtherModel({field2: 1});
      var otherDoc3 = new OtherModel({field2: 1});
      var otherDoc4 = new OtherModel({field2: 2});

      doc1.links = [otherDoc2, otherDoc3]
      doc2.links = [otherDoc1, otherDoc4]

      otherDoc1.links2 = [doc2];
      otherDoc2.links2 = [doc1];
      otherDoc3.links2 = [doc1];
      otherDoc4.links2 = [doc2];

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        return doc2.saveAll()
      }).then(function(result) {
        util.sortById(doc2.links);

        return otherDoc4.deleteAll({links2: {links: true}})
      }).then(function(result) {
        assert.equal(doc1.isSaved(), true)
        assert.equal(doc2.isSaved(), false)
        assert.equal(otherDoc1.isSaved(), false);
        assert.equal(otherDoc2.isSaved(), true);
        assert.equal(otherDoc3.isSaved(), true);
        assert.equal(otherDoc4.isSaved(), false);
        done();
      }).error(done);
    });
    it('hasAndBelongsToMany -- not primary keys - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        field1: Number
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        field2: Number
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "field1", "field2");
      OtherModel.hasAndBelongsToMany(Model, "links2", "field2", "field1");

      var doc1 = new Model({field1: 1});
      var doc2 = new Model({field1: 2});
      var otherDoc1 = new OtherModel({field2: 2});
      var otherDoc2 = new OtherModel({field2: 1});
      var otherDoc3 = new OtherModel({field2: 1});
      var otherDoc4 = new OtherModel({field2: 2});

      doc1.links = [otherDoc2, otherDoc3]
      doc2.links = [otherDoc1, otherDoc4]

      otherDoc1.links2 = [doc2];
      otherDoc2.links2 = [doc1];
      otherDoc3.links2 = [doc1];
      otherDoc4.links2 = [doc2];

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        return doc2.saveAll()
      }).then(function(result) {
        util.sortById(doc2.links);

        return otherDoc4.deleteAll()
      }).then(function(result) {
        assert.equal(doc1.isSaved(), true)
        assert.equal(doc2.isSaved(), false)
        assert.equal(otherDoc1.isSaved(), false);
        assert.equal(otherDoc2.isSaved(), true);
        assert.equal(otherDoc3.isSaved(), true);
        assert.equal(otherDoc4.isSaved(), false);
        done();
      }).error(done);
    });

    it('hasAndBelongsToMany -- not primary keys -- doing what should never be done - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        field1: Number
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        field2: Number
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "field1", "field2");
      OtherModel.hasAndBelongsToMany(Model, "links2", "field2", "field1");

      var doc1 = new Model({field1: 1});
      var doc2 = new Model({field1: 2});
      var otherDoc1 = new OtherModel({field2: 2});
      var otherDoc2 = new OtherModel({field2: 1});
      var otherDoc3 = new OtherModel({field2: 1});
      var otherDoc4 = new OtherModel({field2: 2});

      doc1.links = [otherDoc2, otherDoc3]
      doc2.links = [otherDoc1, otherDoc3]

      otherDoc1.links2 = [doc2];
      otherDoc2.links2 = [doc1];
      otherDoc3.links2 = [doc1];
      otherDoc4.links2 = [doc2];

      doc1.saveAll().then(function(result) {
        doc2.saveAll().then(function(result) {
          otherDoc4.saveAll().then(function(result) {
            util.sortById(doc1.links);
            util.sortById(doc2.links);

            otherDoc4.deleteAll({links2: true}).then(function(result) {
              assert.equal(doc1.isSaved(), true)
              assert.equal(doc2.isSaved(), false)
              assert.deepEqual([
                otherDoc1.isSaved(),
                otherDoc2.isSaved(),
                otherDoc3.isSaved(),
                otherDoc4.isSaved()
              ], [true, true, true, false])

              done();
            });
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- not primary keys -- doing what should never be done - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        field1: Number
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        field2: Number
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "field1", "field2");
      OtherModel.hasAndBelongsToMany(Model, "links2", "field2", "field1");

      var doc1 = new Model({field1: 1});
      var doc2 = new Model({field1: 2});
      var otherDoc1 = new OtherModel({field2: 2});
      var otherDoc2 = new OtherModel({field2: 1});
      var otherDoc3 = new OtherModel({field2: 1});
      var otherDoc4 = new OtherModel({field2: 2});

      doc1.links = [otherDoc2, otherDoc3]
      doc2.links = [otherDoc1, otherDoc3]

      otherDoc1.links2 = [doc2];
      otherDoc2.links2 = [doc1];
      otherDoc3.links2 = [doc1];
      otherDoc4.links2 = [doc2];

      doc1.saveAll().then(function(result) {
        doc2.saveAll().then(function(result) {
          otherDoc4.saveAll().then(function(result) {

            util.sortById(doc1.links);
            util.sortById(doc2.links);

            otherDoc4.deleteAll({links2: {links: true}}).then(function(result) {
              assert.equal(doc1.isSaved(), true)
              assert.equal(doc2.isSaved(), false)
              assert.deepEqual([
                otherDoc1.isSaved(),
                otherDoc2.isSaved(),
                otherDoc3.isSaved(),
                otherDoc4.isSaved()
              ], [false, true, false, false])

              done();
            });
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- not primary keys -- doing what should never be done - 3', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        field1: Number
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        field2: Number
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "field1", "field2");
      OtherModel.hasAndBelongsToMany(Model, "links2", "field2", "field1");

      var doc1 = new Model({field1: 1});
      var doc2 = new Model({field1: 2});
      var otherDoc1 = new OtherModel({field2: 2});
      var otherDoc2 = new OtherModel({field2: 1});
      var otherDoc3 = new OtherModel({field2: 1});
      var otherDoc4 = new OtherModel({field2: 2});

      doc1.links = [otherDoc2, otherDoc3]
      doc2.links = [otherDoc1, otherDoc3]

      otherDoc1.links2 = [doc2];
      otherDoc2.links2 = [doc1];
      otherDoc3.links2 = [doc1];
      otherDoc4.links2 = [doc2];

      doc1.saveAll().then(function(result) {
        doc2.saveAll().then(function(result) {
          otherDoc4.saveAll().then(function(result) {
            util.sortById(doc1.links);
            util.sortById(doc2.links);

            otherDoc4.deleteAll({links2: {links: {links2: true}}}).then(function(result) {
              assert.equal(doc1.isSaved(), false)
              assert.equal(doc2.isSaved(), false)
              assert.deepEqual([
                otherDoc1.isSaved(),
                otherDoc2.isSaved(),
                otherDoc3.isSaved(),
                otherDoc4.isSaved()
              ], [false, true, false, false])

              done();
            });
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- not primary keys -- doing what should never be done - 4', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        field1: Number
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        field2: Number
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "field1", "field2");
      OtherModel.hasAndBelongsToMany(Model, "links2", "field2", "field1");

      var doc1 = new Model({field1: 1});
      var doc2 = new Model({field1: 2});
      var otherDoc1 = new OtherModel({field2: 2});
      var otherDoc2 = new OtherModel({field2: 1});
      var otherDoc3 = new OtherModel({field2: 1});
      var otherDoc4 = new OtherModel({field2: 2});

      doc1.links = [otherDoc2, otherDoc3]
      doc2.links = [otherDoc1, otherDoc3]

      otherDoc1.links2 = [doc2];
      otherDoc2.links2 = [doc1];
      otherDoc3.links2 = [doc1];
      otherDoc4.links2 = [doc2];

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        doc2.saveAll().then(function(result) {
          util.sortById(doc2.links);
          otherDoc4.saveAll().then(function(result) {
            //
            // otherdoc4 -> doc2 -> otherdoc1 -> doc2 -> otherdoc1
            //                    -> otherdoc3
            //           -> otherdoc3 -> doc1 -> otherdoc2
            //                    -> otherdoc3
            //
            // NOTE: We explicitly force twice the deletion of doc2...
            //
            otherDoc4.deleteAll({links2: {links: {links2: {links: true}}}}).then(function(result) {
              assert.equal(doc1.isSaved(), false)
              assert.equal(doc2.isSaved(), false)
              assert.deepEqual([
                otherDoc1.isSaved(),
                otherDoc2.isSaved(),
                otherDoc3.isSaved(),
                otherDoc4.isSaved()
              ], [false, false, false, false])

              done();
            });
          });
        });
      }).error(done);
    });
  });
  describe('getJoin', function(){
    afterEach(cleanTables);

    it('hasOne - belongsTo', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.id, doc.id);
          assert.equal(result.has.id, doc.has.id);
          assert.equal(result.has.otherId, doc.has.otherId);
          OtherModel.get(otherDoc.id).getJoin().run().then(function(result) {
            assert.equal(result.id, doc.has.id);
            assert.equal(result.otherId, doc.has.otherId);
            assert.equal(result.belongsTo.id, doc.id);
            done()
          });
        });

      }).error(done);
    });
    it('hasOne - belongsTo - non matching modelToGet', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin({foo: true}).run().then(function(result) {
          assert.equal(result.id, doc.id);
          assert.equal(result.has, undefined);
          OtherModel.get(otherDoc.id).getJoin({foo: true}).run().then(function(result) {
            assert.equal(result.id, doc.has.id);
            assert.equal(result.otherId, doc.has.otherId);
            assert.equal(result.belongsTo, undefined);
            done()
          });
        });

      }).error(done);
    });
    it('hasOne - belongsTo - matching modelToGet', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasOne(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDoc = new OtherModel(otherValues);

      doc.has = otherDoc;
      otherDoc.belongsTo = doc;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin({has: true}).run().then(function(result) {
          assert.equal(result.id, doc.id);
          assert.equal(result.has.id, doc.has.id);
          assert.equal(result.has.otherId, doc.has.otherId);
          OtherModel.get(otherDoc.id).getJoin({belongsTo: true}).run().then(function(result) {
            assert.equal(result.id, doc.has.id);
            assert.equal(result.otherId, doc.has.otherId);
            assert.equal(result.belongsTo.id, doc.id);
            done()
          });
        });
      }).error(done);
    });
    it('hasMany - belongsTo -- matching modelToGet', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin({has: true}).run().then(function(result) {
          assert.equal(result.id, doc.id);
          assert.equal(result.has.length, 3);

          OtherModel.getAll(doc.id, {index: "otherId"}).getJoin({belongsTo: true}).run().then(function(result) {
            assert.equal(result.length, 3);
            for(var i=0; i<result.length; i++) {
              assert.equal(result[i].belongsTo.id, doc.id)
            }
            done()
          })
        });
      }).error(done);
    });
    it('hasMany - belongsTo -- non matching modelToGet', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin({foo: true}).run().then(function(result) {
          assert.equal(result.id, doc.id);
          assert.equal(result.has, undefined);

          OtherModel.getAll(doc.id, {index: "otherId"}).getJoin({foo: true}).run().then(function(result) {
            assert.equal(result.length, 3);
            for(var i=0; i<result.length; i++) {
              assert.equal(result[i].belongsTo, undefined)
            }
            done()
          })
        });
      }).error(done);
    });
    it('hasMany - belongsTo -- default, fetch everything', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        otherId: String
      });

      Model.hasMany(OtherModel, "has", "id", "otherId");
      OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

      var values = {};
      var otherValues = {};
      var doc = new Model(values);
      var otherDocs = [new OtherModel(otherValues), new OtherModel(otherValues), new OtherModel(otherValues)];

      doc.has = otherDocs;
      otherDocs[0].belongsTo = doc;
      otherDocs[1].belongsTo = doc;
      otherDocs[2].belongsTo = doc;

      doc.saveAll().then(function(result) {
        Model.get(doc.id).getJoin().run().then(function(result) {
          assert.equal(result.id, doc.id);
          assert.equal(result.has.length, 3);

          OtherModel.getAll(doc.id, {index: "otherId"}).getJoin().run().then(function(result) {
            assert.equal(result.length, 3);
            for(var i=0; i<result.length; i++) {
              assert.equal(result[i].belongsTo.id, doc.id)
            }

            done()
          })
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys -- fetch everything by default', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        doc2.saveAll().then(function(result) {
          util.sortById(doc2.links);
          Model.get(doc1.id).getJoin().run().then(function(result) {
            assert.equal(result.id, doc1.id);
            assert.equal(result.links.length, doc1.links.length);
            Model.get(doc2.id).getJoin().run().then(function(result) {
              assert.equal(result.id, doc2.id);
              assert.equal(result.links.length, doc2.links.length);
              done()
            })
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys -- matching modelToGet', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        doc2.saveAll().then(function(result) {
          util.sortById(doc2.links);
          Model.get(doc1.id).getJoin({links: true}).run().then(function(result) {
            assert.equal(result.id, doc1.id);
            assert.equal(result.links.length, doc1.links.length);
            Model.get(doc2.id).getJoin({links: true}).run().then(function(result) {
              assert.equal(result.id, doc2.id);
              assert.equal(result.links.length, doc2.links.length);
              done()
            })
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys -- non matching modelToGet', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        doc2.saveAll().then(function(result) {
          util.sortById(doc2.links);
          Model.get(doc1.id).getJoin({links: true}).run().then(function(result) {
            assert.equal(result.id, doc1.id);
            assert.equal(result.links.length, doc1.links.length);
            Model.get(doc2.id).getJoin({links: true}).run().then(function(result) {
              assert.equal(result.id, doc2.id);
              assert.equal(result.links.length, doc2.links.length);
              done()
            })
          });
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- primary keys -- matching modelToGet with options', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.links = [otherDoc1, otherDoc2, otherDoc4]
      doc2.links = [otherDoc2, otherDoc3, otherDoc4]

      doc1.saveAll().then(function(result) {
        util.sortById(doc1.links);
        doc2.saveAll().then(function(result) {
          util.sortById(doc2.links);
          Model.get(doc1.id).getJoin({links: {
            _apply: function(seq) {
              return seq.orderBy('id');
            }
          }}).run().then(function(result) {
            assert.equal(result.id, doc1.id);
            assert.equal(result.links[0].id, doc1.links[0].id);
            assert.equal(result.links[1].id, doc1.links[1].id);
            assert.equal(result.links[2].id, doc1.links[2].id);
            Model.get(doc2.id).getJoin({links: {
              _apply: function(seq) {
                return seq.orderBy('id');
              }
            }}).run().then(function(result) {
              assert.equal(result.id, doc2.id);
              assert.equal(result.links[0].id, doc2.links[0].id);
              assert.equal(result.links[1].id, doc2.links[1].id);
              assert.equal(result.links[2].id, doc2.links[2].id);

              done()
            })
          });
        });
      }).error(done);
    });
  });
  describe('pair', function(){
    afterEach(cleanTables);

    it('hasAndBelongsToMany -- pairs', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});
      var doc3 = new Model({});
      var doc4 = new Model({});
      var doc5 = new Model({});
      var doc6 = new Model({});

      doc1.links = [doc2, doc3];
      doc2.links = [doc1];
      doc3.links = [doc1, doc2];

      doc1.saveAll({links: true}).then(function(result) {
        return doc2.saveAll({links: true})
      }).then(function(result) {
        return doc3.saveAll({links: true})
      }).then(function(result) {
        return Model.get(doc1.id).getJoin().run()
      }).then(function(result) {
        assert.equal(result.links, undefined);
        return Model.get(doc1.id).getJoin({links: true}).run()
      }).then(function(result) {
        assert.equal(result.links.length, 2);
        done();
      }).error(done);
    });

    it('hasAndBelongsToMany -- pairs', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      Model.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model({});
      var doc2 = new Model({});

      doc1.links = [doc2];

      doc1.saveAll({links: true}).then(function(result) {
        return Model.get(doc1.id).getJoin({links: true}).run()
      }).then(function(result) {
        assert.deepEqual(result.links[0], doc2);
        done();
      }).error(done);
    });

    it('hasOne/belongsTo -- pairs', function(done) {
      var Human = thinky.createModel(modelNames[0], {id: String, name: String, contactId: String});
      Human.belongsTo(Human, "emergencyContact", "contactId", "id");

      var michel = new Human({
        name: "Michel"
      });
      var sophia = new Human({
        name: "Sophia"
      });

      michel.emergencyContact = sophia;
      michel.saveAll({emergencyContact: true}).then(function(result) {
        assert.strictEqual(michel, result);
        assert.equal(michel.isSaved(), true);
        assert.equal(sophia.isSaved(), true);
        assert.equal(sophia.id, michel.contactId);
        done();
      }).error(done);
    });
  });
  describe('delete - hidden links behavior', function() {
    afterEach(cleanTables);

    it('should work for hasOne - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        doc.delete().then(function() {
          assert.equal(doc.isSaved(), false);
          assert.equal(otherDoc.isSaved(), true);
          assert.equal(otherDoc.foreignKey, undefined);
          OtherModel.get(otherDoc.id).run().then(function(otherDoc) {
            assert.equal(otherDoc.isSaved(), true);
            assert.equal(otherDoc.foreignKey, undefined);
            done();
          });
        });
      });

    });
    it('should work for hasOne - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        otherDoc.delete().then(function() {
          assert.equal(doc.isSaved(), true);
          assert.equal(otherDoc.isSaved(), false);
          assert.equal(doc.otherDoc, undefined);
          Model.get(doc.id).getJoin().run().then(function(doc) {
            assert.equal(doc.isSaved(), true);
            assert.equal(doc.otherDoc, undefined);
            done();
          });
        });
      });
    });
    it('should work for hasOne - 3', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          var otherDoc = doc.otherDoc;
          doc.delete().then(function() {
            assert.equal(doc.isSaved(), false);
            assert.equal(otherDoc.isSaved(), true);
            assert.equal(otherDoc.foreignKey, undefined);
            OtherModel.get(otherDoc.id).run().then(function(otherDoc) {
              assert.equal(otherDoc.isSaved(), true);
              assert.equal(otherDoc.foreignKey, undefined);
              done();
            });
          });
        });
      });

    });
    it('should work for hasOne - 4', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          var otherDoc = doc.otherDoc;
          otherDoc.delete().then(function() {
            assert.equal(doc.isSaved(), true);
            assert.equal(otherDoc.isSaved(), false);
            assert.equal(doc.otherDoc, undefined);
            Model.get(doc.id).getJoin().run().then(function(doc) {
              assert.equal(doc.isSaved(), true);
              assert.equal(doc.otherDoc, undefined);
              done();
            });
          });
        });
      });
    });
    it('should work for belongsTo - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        foreignKey: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        doc.delete().then(function() {
          assert.equal(doc.isSaved(), false);
          assert.equal(otherDoc.isSaved(), true);
          done();
        });
      });
    });
    it('should work for belongsTo - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        foreignKey: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        otherDoc.delete().then(function() {
          assert.equal(doc.isSaved(), true);
          assert.equal(otherDoc.isSaved(), false);
          assert.equal(doc.otherDoc, undefined);
          assert.equal(doc.foreignKey, undefined);
          Model.get(doc.id).getJoin().run().then(function(doc) {
            assert.equal(doc.isSaved(), true);
            assert.equal(doc.otherDoc, undefined);
            assert.equal(doc.foreignKey, undefined);
            done();
          });
        });
      });
    });
    it('should work for belongsTo - 3', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        foreignKey: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          doc.delete().then(function() {
            assert.equal(doc.isSaved(), false);
            assert.equal(doc.otherDoc.isSaved(), true);
            done();
          });
        });
      });
    });
    it('should work for belongsTo - 4', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String,
        foreignKey: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id");

      var doc = new Model({});
      var otherDoc = new OtherModel({});
      doc.otherDoc = otherDoc;

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          var otherDoc = doc.otherDoc;
          doc.otherDoc.delete().then(function() {
            assert.equal(doc.isSaved(), true);
            assert.equal(otherDoc.isSaved(), false);
            assert.equal(doc.otherDoc, undefined);
            assert.equal(doc.foreignKey, undefined);
            Model.get(doc.id).getJoin().run().then(function(doc) {
              assert.equal(doc.isSaved(), true);
              assert.equal(doc.otherDoc, undefined);
              assert.equal(doc.foreignKey, undefined);
              done();
            });
          });
        });
      });
    });
    it('should work for hasMany - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        doc.delete().then(function() {
          assert.equal(doc.isSaved(), false);
          assert.equal(otherDoc1.isSaved(), true);
          assert.equal(otherDoc2.isSaved(), true);
          assert.equal(otherDoc3.isSaved(), true);
          assert.equal(otherDoc1.foreignKey, undefined);
          assert.equal(otherDoc2.foreignKey, undefined);
          assert.equal(otherDoc3.foreignKey, undefined);
          OtherModel.get(otherDoc1.id).run().then(function(otherDoc1) {
            assert.equal(otherDoc1.isSaved(), true);
            assert.equal(otherDoc1.foreignKey, undefined);
            done();
          });
        });
      });
    });
    it('should work for hasMany - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        otherDoc1.delete().then(function() {
          assert.equal(doc.isSaved(), true);
          assert.equal(otherDoc1.isSaved(), false);
          assert.equal(otherDoc2.isSaved(), true);
          assert.equal(otherDoc3.isSaved(), true);
          assert.notEqual(otherDoc1.foreignKey, undefined);
          // We currently don't clean in this case
          assert.notEqual(otherDoc2.foreignKey, undefined);
          assert.notEqual(otherDoc3.foreignKey, undefined);
          assert.equal(doc.otherDocs.length, 2);
          Model.get(doc.id).getJoin().run().then(function(otherDoc1) {
            assert.equal(doc.otherDocs.length, 2);
            done();
          });
        });
      });
    });
    it('should work for hasMany - 3', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          var otherDoc1 = doc.otherDocs[0];
          var otherDoc2 = doc.otherDocs[1];
          var otherDoc3 = doc.otherDocs[2];
          doc.delete().then(function() {
            assert.equal(doc.isSaved(), false);
            assert.equal(otherDoc1.isSaved(), true);
            assert.equal(otherDoc2.isSaved(), true);
            assert.equal(otherDoc3.isSaved(), true);
            assert.equal(otherDoc1.foreignKey, undefined);
            assert.equal(otherDoc2.foreignKey, undefined);
            assert.equal(otherDoc3.foreignKey, undefined);
            OtherModel.get(otherDoc1.id).run().then(function(otherDoc1) {
              assert.equal(otherDoc1.isSaved(), true);
              assert.equal(otherDoc1.foreignKey, undefined);
              done();
            });
          });
        });
      });
    });
    it('should work for hasMany - 4', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: String
      });

      Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          var otherDoc1 = doc.otherDocs[0];
          var otherDoc2 = doc.otherDocs[1];
          var otherDoc3 = doc.otherDocs[2];
          otherDoc1.delete().then(function() {
            assert.equal(doc.isSaved(), true);
            assert.equal(otherDoc1.isSaved(), false);
            assert.equal(otherDoc2.isSaved(), true);
            assert.equal(otherDoc3.isSaved(), true);
            assert.notEqual(otherDoc1.foreignKey, undefined);
            // We currently don't clean in this case
            //assert.equal(otherDoc2.foreignKey, undefined);
            assert.notEqual(otherDoc3.foreignKey, undefined);
            assert.equal(doc.otherDocs.length, 2);
            Model.get(doc.id).getJoin().run().then(function(otherDoc1) {
              assert.equal(doc.otherDocs.length, 2);
              done();
            });
          });
        });
      });
    });
    it('should work for hasAndBelongsToMany - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        return doc.delete()
      }).then(function() {
        assert.equal(doc.isSaved(), false);
        assert.equal(otherDoc1.isSaved(), true);
        assert.equal(otherDoc2.isSaved(), true);
        assert.equal(otherDoc3.isSaved(), true);
        assert.equal(otherDoc3.isSaved(), true);
        assert.equal(doc.otherDocs.length, 3);
        return r.table(Model._getModel()._joins.otherDocs.link).count().run()
      }).then(function(result) {
        assert.equal(result, 0);
        done();
      });
    });
    it('should work for hasAndBelongsToMany - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        otherDoc1.delete().then(function() {
          assert.equal(doc.isSaved(), true);
          assert.equal(otherDoc1.isSaved(), false);
          assert.equal(otherDoc2.isSaved(), true);
          assert.equal(otherDoc3.isSaved(), true);
          assert.equal(doc.otherDocs.length, 2);
          Model.get(doc.id).getJoin().run().then(function(otherDoc1) {
            assert.equal(doc.otherDocs.length, 2);
            done();
          });
        });
      });
    });
    it('should work for hasAndBelongsToMany - 3', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          doc.delete().then(function() {
            assert.equal(doc.isSaved(), false);
            assert.equal(otherDoc1.isSaved(), true);
            assert.equal(otherDoc2.isSaved(), true);
            assert.equal(otherDoc3.isSaved(), true);
            assert.equal(otherDoc3.isSaved(), true);
            assert.equal(doc.otherDocs.length, 3);
            r.table(Model._getModel()._joins.otherDocs.link).count().run().then(function(result) {
              assert.equal(result, 0);
              done();
            });
          });
        });
      });
    });
    it('should work for hasAndBelongsToMany - 4', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id");

      var doc = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      doc.otherDocs = [otherDoc1, otherDoc2, otherDoc3];

      doc.saveAll().then(function() {
        Model.get(doc.id).getJoin().run().then(function(doc) {
          otherDoc1 = doc.otherDocs[0];
          otherDoc2 = doc.otherDocs[1];
          otherDoc3 = doc.otherDocs[2];
          otherDoc1.delete().then(function(result) {
            assert.strictEqual(result, otherDoc1);
            assert.equal(doc.isSaved(), true);
            assert.equal(otherDoc1.isSaved(), false);
            assert.equal(otherDoc2.isSaved(), true);
            assert.equal(otherDoc3.isSaved(), true);
            assert.equal(doc.otherDocs.length, 2);
            Model.get(doc.id).getJoin().run().then(function(otherDoc1) {
              assert.equal(doc.otherDocs.length, 2);
              done();
            });
          });
        });
      });
    });

    it('hasAndBelongsToMany -- with keys only', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model(values);
      var doc2 = new Model(otherValues);
      var otherDoc1 = new OtherModel({id: '1'});
      var otherDoc2 = new OtherModel({id: '2'});
      var otherDoc3 = new OtherModel({id: '3'});
      var otherDoc4 = new OtherModel({id: '4'});

      doc1.links = ['1', '2', '4']
      doc2.links = ['2', '3', '4']

      OtherModel.save([otherDoc1, otherDoc2, otherDoc3, otherDoc4]).then(function() {
        return doc1.saveAll()
      }).then(function(result) {
        return doc2.saveAll()
      }).then(function(result) {
        Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
          return seq.orderBy('id')
        }}}).run().then(function(result) {
          assert.equal(result.id, doc1.id);
          assert.equal(result.links[0].id, doc1.links[0]);
          assert.equal(result.links[1].id, doc1.links[1]);
          assert.equal(result.links[2].id, doc1.links[2]);
          Model.get(doc2.id).getJoin({links: { _apply: function(seq) {
            return seq.orderBy('id');
          }}}).run().then(function(result) {
            assert.equal(result.id, doc2.id);
            assert.equal(result.links[0].id, doc2.links[0]);
            assert.equal(result.links[1].id, doc2.links[1]);
            assert.equal(result.links[2].id, doc2.links[2]);
            done()
          })
        });
      }).error(done);
    });
    it('hasAndBelongsToMany -- with keys only and a missing doc', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model(values);
      var doc2 = new Model(otherValues);
      var otherDoc1 = new OtherModel({id: '1'});
      var otherDoc2 = new OtherModel({id: '2'});
      var otherDoc3 = new OtherModel({id: '3'});
      //Missing doc
      //var otherDoc4 = new OtherModel({id: '4'});

      doc1.links = ['1', '2', '4']
      doc2.links = ['2', '3', '4']

      OtherModel.save([otherDoc1, otherDoc2, otherDoc3]).then(function() {
        return doc1.saveAll()
      }).then(function(result) {
        return doc2.saveAll()
      }).then(function(result) {
        return Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
          return seq.orderBy('id')
        }}}).run()
      }).then(function(result) {
        assert.equal(result.id, doc1.id);
        assert.equal(result.links.length, 2);
        assert.equal(result.links[0].id, doc1.links[0]);
        assert.equal(result.links[1].id, doc1.links[1]);
        //assert.equal(result.links[2].id, doc1.links[2]);
        return Model.get(doc2.id).getJoin({links: { _apply: function(seq) {
          return seq.orderBy('id');
        }}}).run()
      }).then(function(result) {
        assert.equal(result.id, doc2.id);
        assert.equal(result.links.length, 2);
        assert.equal(result.links[0].id, doc2.links[0]);
        assert.equal(result.links[1].id, doc2.links[1]);
        //assert.equal(result.links[2].id, doc2.links[2]);

        var otherDoc4 = new OtherModel({id: '4'});
        return otherDoc4.save();
      }).then(function(result) {
        return Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
          return seq.orderBy('id')
        }}}).run()
      }).then(function(result) {
        assert.equal(result.id, doc1.id);
        assert.equal(result.links.length, 3);
        assert.equal(result.links[0].id, doc1.links[0]);
        assert.equal(result.links[1].id, doc1.links[1]);
        assert.equal(result.links[2].id, doc1.links[2]);
        return Model.get(doc2.id).getJoin({links: { _apply: function(seq) {
          return seq.orderBy('id');
        }}}).run()
      }).then(function(result) {
        assert.equal(result.id, doc2.id);
        assert.equal(result.links.length, 3);
        assert.equal(result.links[0].id, doc2.links[0]);
        assert.equal(result.links[1].id, doc2.links[1]);
        assert.equal(result.links[2].id, doc2.links[2]);
        done()
      }).error(done);
    });
    it('hasAndBelongsToMany -- Adding a new relation', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });

      Model.hasAndBelongsToMany(OtherModel, "links", "id", "id");
      OtherModel.hasAndBelongsToMany(Model, "links", "id", "id");

      var values = {};
      var otherValues = {};
      var doc1 = new Model(values);
      var doc2 = new Model(otherValues);
      var otherDoc1 = new OtherModel({id: '1'});
      var otherDoc2 = new OtherModel({id: '2'});
      var otherDoc3 = new OtherModel({id: '3'});
      var otherDoc4 = new OtherModel({id: '4'});

      doc1.links = ['1', '2']
      doc2.links = ['2', '3']

      OtherModel.save([otherDoc1, otherDoc2, otherDoc3, otherDoc4]).then(function() {
        return doc1.saveAll()
      }).then(function(result) {
        return doc2.saveAll()
      }).then(function(result) {
        return Model.get(doc1.id).run()
      }).then(function(result) {
        result.links = ['4'];
        return result.saveAll({links: true})
      }).then(function(result) {
        return Model.get(doc1.id).getJoin({links: { _apply: function(seq) {
          return seq.orderBy('id')
        }}}).run()
      }).then(function(result) {
        assert.equal(result.id, doc1.id);
        assert.equal(result.links.length, 3);
        done()
      }).catch(done);
    });
    it('Regression #356 - 1', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: type.string().required()
      });

      Model.hasMany(OtherModel, 'others', 'id', 'foreignKey' );
      OtherModel.belongsTo(Model, 'joined', 'foreignKey', 'id');

      var doc = new Model({
        id: '1',
        others: [
          {id: '10'},
          {id: '20'},
          {id: '30'},
        ]
      });

      doc.saveAll({ others: true }).then(function(user){
        return doc.others[1].delete();
      }).then(function() {
        assert.equal(doc.others.length, 2);
        return doc.saveAll({others: true});
      }).then(function() {
        return OtherModel._get('20').execute()
      }).then(function(result) {
        assert.equal(result, null);
        done();
      });
    });
    it('Regression #356 - 2', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
        foreignKey: type.string().required()
      });

      Model.hasOne(OtherModel, 'other', 'id', 'foreignKey' );
      OtherModel.belongsTo(Model, 'joined', 'foreignKey', 'id');

      var doc = new Model({
        id: '1',
        other: {id: '10'}
      });

      doc.saveAll({ other: true }).then(function(user){
        return doc.other.delete();
      }).then(function() {
        assert.equal(doc.other, undefined)
        return doc.saveAll({other: true});
      }).then(function() {
        return OtherModel._get('10').execute()
      }).then(function(result) {
        assert.equal(result, null);
        done();
      });
    });
  });
  describe('manual joins', function() {
    afterEach(cleanTables);

    it('innerJoin', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });
      var OtherModel = thinky.createModel(modelNames[1], {
        id: String
      });


      var doc = new Model({});
      var otherDocs = [new OtherModel({}), new OtherModel({}), new OtherModel({})];
      var promises = [doc.save(), otherDocs[0].save(), otherDocs[1].save(), otherDocs[2].save()];

      Promise.all(promises).then(function() {
        return Model.innerJoin(OtherModel.between(r.minval, r.maxval)._query, function() { return true}).execute()
      }).then(function(result) {
        assert.equal(result.length, 3);
        assert.deepEqual(result[0].left, doc);
        assert.deepEqual(result[1].left, doc);
        assert.deepEqual(result[2].left, doc);
        done();
      });
    });
  });
  describe('multiple hasAndBelongsToMany', function(){
    afterEach(cleanTables);

    it('between two modes should work (not just pairs)', function(done) {
      var Model = thinky.createModel(modelNames[0], {
        id: String
      });

      var OtherModel = thinky.createModel(modelNames[1], {
        id: String,
      });

      Model.hasAndBelongsToMany(OtherModel, "type1", "id", "id", {type: "type1"});
      Model.hasAndBelongsToMany(OtherModel, "type2", "id", "id", {type: "type2"});
      OtherModel.hasAndBelongsToMany(Model, "type1", "id", "id", {type: "type1"});
      OtherModel.hasAndBelongsToMany(Model, "type2", "id", "id", {type: "type2"});

      var doc1 = new Model({});
      var doc2 = new Model({});
      var otherDoc1 = new OtherModel({});
      var otherDoc2 = new OtherModel({});
      var otherDoc3 = new OtherModel({});
      var otherDoc4 = new OtherModel({});

      doc1.type1 = [otherDoc1, otherDoc2];
      doc1.type2 = [otherDoc3, otherDoc4];
      doc2.type1 = [otherDoc3]
      doc2.type2 = [otherDoc1, otherDoc4]

      doc1.saveAll({type1: true, type2: true}).then(function(result) {
        return doc2.saveAll({type1: true, type2: true})
      }).then(function(result) {
        return Model.get(doc1.id).getJoin({type1: true, type2: true}).run();
      }).then(function(result) {
        util.sortById(doc1.type1);
        util.sortById(doc1.type2);
        util.sortById(doc2.type1);
        util.sortById(doc2.type2);

        util.sortById(result.type1);
        util.sortById(result.type2);

        assert.equal(result.type1.length, 2);
        assert.equal(result.type1[0].id, doc1.type1[0].id);
        assert.equal(result.type1[1].id, doc1.type1[1].id);
        assert.equal(result.type2.length, 2);
        assert.equal(result.type2[0].id, doc1.type2[0].id);
        assert.equal(result.type2[1].id, doc1.type2[1].id);
        return Model.get(doc2.id).getJoin({type1: true, type2: true}).run();
      }).then(function(result) {
        util.sortById(result.type1);
        util.sortById(result.type2);

        assert.equal(result.type1.length, 1);
        assert.equal(result.type1[0].id, doc2.type1[0].id);
        assert.equal(result.type2.length, 2);
        assert.equal(result.type2[0].id, doc2.type2[0].id);
        assert.equal(result.type2[1].id, doc2.type2[1].id);
        return OtherModel.get(otherDoc1.id).getJoin({type1: true, type2: true}).run();
      }).then(function(result) {
        assert.equal(result.type1.length, 1);
        assert.equal(result.type1[0].id, doc1.id);
        assert.equal(result.type2.length, 1);
        assert.equal(result.type2[0].id, doc2.id);
        return OtherModel.get(otherDoc4.id).getJoin({type1: true, type2: true}).run();
      }).then(function(result) {
        util.sortById(result.type2);
        var expected = [doc1, doc2];
        util.sortById(expected);

        assert.equal(result.type1.length, 0);
        assert.equal(result.type2.length, 2);
        assert.equal(result.type2[0].id, expected[0].id);
        assert.equal(result.type2[1].id, expected[1].id);
        done();
      }).catch(done);
    });
  });
});
