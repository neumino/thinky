var config = require(__dirname+'/../config.js');

var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

describe('Advanced cases', function(){
    it('hasOne - belongsTo', function(done) {
        var name = util.s8();
        var Model = thinky.createModel(name, {
            id: String
        });

        var otherName = util.s8();
        var OtherModel = thinky.createModel(otherName, {
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
            assert.equal(typeof result.id, 'string')
            assert.equal(typeof result.has.id, 'string')
            assert.equal(result.id, result.has.otherId)

            assert.strictEqual(result, doc);
            assert.strictEqual(result.has, doc.has);
            assert.strictEqual(doc.has, otherDoc);

            Model.get(doc.id).getJoin().run().then(function(result) {
                assert.deepEqual(result, doc);
                OtherModel.get(otherDoc.id).getJoin().run().then(function(result) {
                    assert.equal(result.id, otherDoc.id);
                    assert.equal(result.belongsTo.id, doc.id);
                    done()
                })
            });
        }).error(done);
    });
    
    it('hasMany - belongsTo', function(done) {
        var name = util.s8();
        var Model = thinky.createModel(name, {
            id: String
        });

        var otherName = util.s8();
        var OtherModel = thinky.createModel(otherName, {
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
            Model.get(doc.id).getJoin({has: { order: "id"}}).run().then(function(result) {
                assert.deepEqual(result, doc);
                OtherModel.getAll(doc.id, {index: "otherId"}).getJoin().run().then(function(result) {
                    assert.equal(result.length, 3);
                    done()
                })
            });
        }).error(done);
    });

});
