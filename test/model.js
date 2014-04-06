var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

describe('createModel', function(){
    var name = util.s8();
    it('Create a new model', function(){
        model = thinky.createModel(name, {id: String, name: String})
        assert(model);
    });
    it('Check if the table was created', function(done){
        model.on("ready", function() {
            r.tableList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    assert.notEqual(result.indexOf(name), -1)
                    done();
                }).error(done);
            }).error(done)
        });
    });
    it('Create multiple models', function(){
        var name1 = util.s8();
        var model1 = thinky.createModel(name1, {id: String, name: String})

        var name2 = util.s8();
        var model2 = thinky.createModel(name2, {id: String, name: String})

        assert(model1 !== model2);
    });
});
describe('Model', function() {
    var name = util.s8();

    var Model =
    before(function() {
        Model = thinky.createModel(name, { str: String });
    });
    it('Create a new instance of the Model', function() {
        var str = util.s8();
        var doc = new Model({str: str});

        assert(util.isPlainObject(doc));
        assert.equal(doc.str, str);
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
        var OtherModel = thinky.createModel(otherName, { str: String });

        var otherStr = util.s8();
        var otherDoc = new OtherModel({str: otherStr});

        assert.equal(doc.str, str);
        assert.equal(otherDoc.str, otherStr);

        assert.notEqual(otherDoc.getModel(), doc.getModel());
        assert.equal(doc.getName(), name);
        assert.equal(otherDoc.getName(), otherName);
    });
});

describe("Joins", function() {
    it('hasOne should save the join', function() {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String});

        var otherName = util.s8();
        var otherModel = thinky.createModel(otherName, { id: String, otherId: String });

        model.hasOne(otherModel, "otherDoc", "otherId", "id");
        assert(model._getModel()._joins["otherDoc"])
    });
    it('hasOne should create an index on the other model', function(done) {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String, foreignKeyName: String });

        var foreignKey = util.s8();

        var otherName = util.s8();
        var schema = {id: String};
        schema[foreignKey] = String;
        var otherModel = thinky.createModel(otherName, schema);

        model.hasOne(otherModel, "otherDoc", "modelId", foreignKey);

        otherModel.on("ready", function() {
            r.table(otherModel.getName()).indexList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    r.table(otherModel.getName()).indexWait(foreignKey).run().then(function() {
                        done();
                    }).error(done);
                });

            }).error(done);

        })
    });
    it('BelongsTo should create an index on the model called', function(done) {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String, otherId: String });

        var foreignKey = util.s8();

        var otherName = util.s8();
        var schema = {id: String};
        schema[foreignKey] = String;
        var otherModel = thinky.createModel(otherName, schema);

        model.belongsTo(otherModel, "otherDoc", foreignKey, "otherId");

        model.on("ready", function() {
            r.table(model.getName()).indexList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    r.table(model.getName()).indexWait(foreignKey).run().then(function() {
                        done();
                    }).error(done);
                });

            }).error(done);

        })
    });
    it('hasMany should create an index on the other model', function(done) {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String });

        var foreignKey = util.s8();

        var otherName = util.s8();
        var schema = {id: String};
        schema[foreignKey] = String;
        var otherModel = thinky.createModel(otherName, schema);

        model.hasMany(otherModel, "otherDocs", "modelId", foreignKey);

        otherModel.on("ready", function() {
            r.table(otherModel.getName()).indexList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    r.table(otherModel.getName()).indexWait(foreignKey).run().then(function() {
                        done();
                    }).error(done);
                });

            }).error(done);
        })
    });

    it('hasAndBelongsToMany should create an index on this table', function(done) {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String, notid1: String });

        var otherName = util.s8();
        var otherModel = thinky.createModel(otherName, { id: String, notid2: String });

        model.hasAndBelongsToMany(otherModel, "otherDocs", "notid1", "notid2");

        var linkName;
        if(model.getName() < otherModel.getName()) {
            linkName = model.getName()+"_"+otherModel.getName();
        }
        else {
            linkName = otherModel.getName()+"_"+model.getName();
        }

        model.on("ready", function() {
            r.table(model.getName()).indexList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    r.table(model.getName()).indexWait("notid1").run().then(function() {
                        done();
                    }).error(done);
                });

            }).error(done);
        })
    });

    it('hasAndBelongsToMany should create an index on the joined table', function(done) {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String, notid1: String });

        var otherName = util.s8();
        var otherModel = thinky.createModel(otherName, { id: String, notid2: String });

        model.hasAndBelongsToMany(otherModel, "otherDocs", "notid1", "notid2");

        var linkName;
        if(model.getName() < otherModel.getName()) {
            linkName = model.getName()+"_"+otherModel.getName();
        }
        else {
            linkName = otherModel.getName()+"_"+model.getName();
        }

        otherModel.on("ready", function() {
            r.table(otherModel.getName()).indexList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    r.table(otherModel.getName()).indexWait("notid2").run().then(function() {
                        done();
                    }).error(done);
                });

            }).error(done);
        })
    });

    it('hasAndBelongsToMany should create a linked table with indexes', function(done) {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String, notid1: String });

        var otherName = util.s8();
        var otherModel = thinky.createModel(otherName, { id: String, notid2: String });

        model.hasAndBelongsToMany(otherModel, "otherDocs", "notid1", "notid2");

        var linkName;
        if(model.getName() < otherModel.getName()) {
            linkName = model.getName()+"_"+otherModel.getName();
        }
        else {
            linkName = otherModel.getName()+"_"+model.getName();
        }

        var numReady = 0;

        model.on('ready', function() {
            r.table(linkName).indexList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    r.table(otherModel.getName()).indexWait("notid2").run().then(function() {
                        done();
                    }).error(done);
                });

            }).error(done);
        })
    });


});
