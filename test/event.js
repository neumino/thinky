var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

describe('Events', function(){
    it('Add events on doc', function(done){
        var Model = thinky.createModel(util.s8(), {id: String}, {init: false})
        var doc = new Model({});
        doc.addListener("foo", done);
        doc.emit("foo");
    });
    it('Events on model should be forward to documents', function(done){
        var count = 0;
        var Model = thinky.createModel(util.s8(), {id: String}, {init: false})
        Model.docOn("foo", function() {
            count++;
            if (count === 2) {
                done();
            }
        });
        var doc = new Model({});
        doc.emit("foo");
        doc.emit("foo");
    });
    it('Doc should emit save when saved', function(done){
        var count = 0;
        var Model = thinky.createModel(util.s8(), {id: String})
        var doc = new Model({});
        doc.once("saved", function() {
            done();
        });
        doc.save();
    });
    it('Doc should emit save when saved', function(done){
        var count = 0;
        var Model = thinky.createModel(util.s8(), {id: String})
        var doc = new Model({});
        doc.once("deleted", function() {
            done();
        });
        doc.save().then(function() {
            doc.delete();
        });
    });
    it('Doc should emit save when deleted -- hasAndBelongsToMany', function(done){
        var count = 0;
        var Model = thinky.createModel(util.s8(), {id: String})
        Model.hasAndBelongsToMany(Model, 'links', 'id', 'id');

        var doc1 = new Model({});
        var doc2 = new Model({});
        doc1.links = [doc2];

        doc2.once("deleted", function() {
            done();
        });
        doc1.saveAll({links: true}).then(function() {
            assert.equal(doc2.isSaved(), true)
            doc1.deleteAll({links: true}).then(function() {
                assert.equal(doc2.isSaved(), false)
            });
        });
    });
    it('Doc should emit save when deleted -- hasMany', function(done){
        var count = 0;
        var Model = thinky.createModel(util.s8(), {id: String, foreignKey: String})
        Model.hasMany(Model, 'links', 'id', 'id');

        var doc1 = new Model({});
        var doc2 = new Model({});
        doc1.links = [doc2];

        doc2.once("deleted", function() {
            done();
        });
        doc1.saveAll({links: true}).then(function() {
            assert.equal(doc2.isSaved(), true)
            doc1.deleteAll({links: true}).then(function() {
                assert.equal(doc2.isSaved(), false)
            });
        });
    });
    it('Test saving event', function(done){
        var Model = thinky.createModel(util.s8(), {id: Number})
        var doc = new Model({});
        doc.addListener("saving", function(doc) {
            doc.id = 1;
        });
        doc.save().then(function() {
            assert.equal(doc.id, 1);
            Model.get(doc.id).run().then(function(result) {
                assert.equal(result.id, 1);
                done();
            });
        });
    });
    it('Test retrieved event', function(done){
        var Model = thinky.createModel(util.s8(), {id: Number})
        var doc = new Model({id: 1});

        Model.addListener("retrieved", function(doc) {
            doc.id++;
        });

        doc.save().then(function() {
            assert.equal(doc.id, 1);
            Model.get(doc.id).run().then(function(result) {
                assert.equal(result.id, 2);
                done();
            });
        });
    });
});
