var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;
var Document = require(__dirname+'/../lib/document.js');

var util = require(__dirname+'/util.js');
var assert = require('assert');

describe('Model queries', function(){
    var Model;
    var data = [];
    var bag = {};
    before(function(done) {
        var name = util.s8();
        Model = thinky.createModel(name, {
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
            }).save().then(function(result) {
                data.push(result);

                str = util.s8();
                num = util.random();
                doc = new Model({
                    str: str,
                    num: num
                }).save().then(function(result) {
                    data.push(result);

                    for(var i=0; i<data.length; i++) {
                        bag[data[i].id] = data[i]
                    }

                    done()
                }).error(done);
            }).error(done);
        }).error(done);
    });
    it('Model.run() should return', function(done){
        Model.run().then(function(result) {
            done();
        }).error(done);
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
    it('Model.get() should return the expected document', function(done){
        Model.get(data[0].id).run().then(function(result) {
            assert.deepEqual(data[0], result);
            done();
        }).error(done);
    });
    it('Model.get() should return an instance of the model', function(done){
        Model.get(data[0].id).run().then(function(result) {
            assert.deepEqual(result.__proto__.constructor, Model);
            assert.deepEqual(result.constructor, Model);
            done();
        }).error(done);
    });

});
