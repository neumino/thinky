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

        //TODO Catch and don't follow circular references in saveAll
        doc.saveAll().then(function(result) {
            assert.equal(typeof result.id, 'string')
            assert.equal(typeof result.has.id, 'string')
            assert.equal(result.id, result.has.otherId)

            assert.strictEqual(result, doc);
            assert.strictEqual(result.has, doc.has);
            assert.strictEqual(doc.has, otherDoc);

            Model.get(doc.id).run().then(function(result) {
                OtherModel.get(otherDoc.id).run().then(function(result) {
                    util.log(result);
                    done()
                })
            });
        }).error(done);
    });
});
