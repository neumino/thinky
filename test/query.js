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
    it('Model.get() should return an instance of the model', function(done){
        Model.get(data[0].id).run().then(function(result) {
            assert.deepEqual(result.__proto__.constructor, Model);
            assert.deepEqual(result.constructor, Model);
            done();
        }).error(done);
    });
    it('Model.get() should return null if nothing is found', function(done){
        Model.get("nonExistingId").run().error(function(error) {
            assert.equal(error.message, "Cannot build a new instance of `"+Model.getTableName()+"` with `null`.");
            done();
        });
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
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })


            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
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
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
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
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
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
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
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
                Model.get(doc.id).getJoin({has: { _order: "id"}}).run().then(function(result) {
                    for(var i=0; i<result.has.length; i++) {
                        for(var j=i+1; j<result.has.length; j++) {
                            assert(result.has[i].id < result.has[j].id)
                        }
                    }
                });
            }).error(done);
        });
    });
});

describe('Query.run() should take options', function(){
    var Model;
    var data = [];
    before(function(done) {
        var name = util.s8();
        Model = thinky.createModel(name, {
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
});
