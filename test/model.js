var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

/*
describe('createModel', function(){
    var name = util.s8();
    it('Create a new model', function(){
        model = thinky.createModel(name, {id: String, name: String})
        assert(model);
    });
    it('Check if the table was created', function(done){
        setTimeout(function() {
            r.tableList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    assert.notEqual(result.indexOf(name), -1)
                    done();
                }).error(done);
            }).error(done)
        }, 1000);
    });

    it('Create multiple models', function(){
        var name1 = util.s8();
        var model1 = thinky.createModel(name1, {id: String, name: String})

        var name2 = util.s8();
        var model2 = thinky.createModel(name2, {id: String, name: String})

        assert(model1 !== model2);
    });
});
*/
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
        var model = thinky.createModel(name, { id: String, otherId: String });

        var otherName = util.s8();
        var otherModel = thinky.createModel(otherName, { id: String });

        model.hasOne(otherModel, "otherDoc", "otherId", "id");
        assert(model._getModel()._joins[otherModel._getModel()._name])
    });
    /*
    it('hasOne should create an index', function(done) {
        var name = util.s8();
        var model = thinky.createModel(name, { id: String, otherId: String });

        var foreignKey = util.s8();

        var otherName = util.s8();
        var schema = {id: String};
        schema[foreignKey] = String;
        var otherModel = thinky.createModel(otherName, schema);

        model.hasOne(otherModel, "otherDoc", "otherId", foreignKey);

        setTimeout(function() {
            r.table(otherModel.getName()).indexList().run().then(function(cursor) {
                cursor.toArray().then(function(result) {
                    r.table(otherModel.getName()).indexWait(foreignKey).run().then(function() {
                        done();
                    }).error(done);
                });

            }).error(done);

        }, 2000)
    });
    */
});
