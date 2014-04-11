var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');


describe('save', function() {
     
    describe('Basic', function() {
        var Model;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })
        });
        it('Save should change the status of the doc', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            assert.equal(doc.isSaved(), false);
            doc.save().then(function(result) {
                assert.equal(doc.isSaved(), true);
                done();
            }).error(done);
        });

        it('Save when the table is not yet ready', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            doc.save().then(function(result) {
                done();

            }).error(done);
        });
        it('Save then the table is ready', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            doc.save().then(function(result) {
                done();
            }).error(done);
        });
        it('Save the document should be updated on place', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            doc.save().then(function(result) {
                assert.strictEqual(doc, result);
                assert.equal(doc.str, str);
                assert.equal(doc.num, num);
                assert.notEqual(doc.id, undefined);
                done();
            }).error(done);
        });
    });
    describe("Joins - hasOne", function() {
        var Model, OtherModel;
        before(function() {
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
        });

        it('save should save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), false);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        });
        it('new should create instances of Document for joined documents too', function() {
            var docValues = {str: util.s8(), num: util.random(), otherDoc: {str: util.s8(), num: util.random()}}
            doc = new Model(docValues);
            assert.equal(doc._getModel()._name, Model.getName())
            assert.equal(doc.otherDoc._getModel()._name, OtherModel.getName())
        });
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDoc, otherDoc)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), true);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);

                assert.strictEqual(doc.otherDoc, otherDoc)
                assert.strictEqual(doc.otherDoc.foreignKey, doc.id)
                done();
            }).error(done);
        })
    });
    describe("Joins - belongsTo", function() {
        var Model, OtherModel;
        before(function() {
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
        });

        it('save should save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), false);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        })
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDoc, otherDoc)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc2) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), true);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);

                assert.strictEqual(doc.otherDoc, otherDoc)
                assert.strictEqual(doc.foreignKey, doc.otherDoc.id)
                done();
            }).error(done);
        })
        it('saveAll should save a referene to this in the belongsTo doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc2) {
                assert.equal(doc.otherDoc.__proto__._parents._belongsTo[Model.getName()][0].doc, doc);
                done();
            }).error(done);
        })

    });

    describe("Joins - hasMany", function() {
        var Model, OtherModel;
        before(function() {
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
        });

        it('save shouls save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), false);
                }
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        })
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDocs, otherDocs)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), true);
                }
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);

                assert.strictEqual(doc.otherDocs, otherDocs)
                for(var i=0; i<otherDocs.length; i++) {
                    assert.strictEqual(doc.otherDocs[i].foreignKey, doc.id)
                }
                done();
            }).error(done);
        })
    });
    describe("Joins - hasAndBelongsToMany", function() {
        var Model, OtherModel;
        before(function() {
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
                num: Number
            })
            Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")
        });
        it('save shouls save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), false);
                }
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        })
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDocs, otherDocs)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), true);
                    assert.equal(typeof doc.otherDocs[i].id, 'string');
                }

                var linkName;
                if(Model.getName() < OtherModel.getName()) {
                    linkName = Model.getName()+"_"+OtherModel.getName();
                }
                else {
                    linkName = OtherModel.getName()+"_"+Model.getName();
                }

                r.table(linkName).run().then(function(cursor) {
                    cursor.toArray().then(function(result) {
                        assert.equal(result.length, 3)

                        assert.equal(doc.isSaved(), true);
                        assert.equal(typeof doc.id, 'string')
                        assert.equal(doc.str, docValues.str);
                        assert.equal(doc.num, docValues.num);

                        assert.strictEqual(doc.otherDocs, otherDocs)
                        done();
                    })
                })

            }).error(done);
        })
        it('saveAll should create new links with the good id', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                var linkName, found;

                if(Model.getName() < OtherModel.getName()) {
                    linkName = Model.getName()+"_"+OtherModel.getName();
                }
                else {
                    linkName = OtherModel.getName()+"_"+Model.getName();
                }
                r.table(linkName).run().then(function(cursor) {
                    cursor.toArray().then(function(result) {
                        var total = 0;
                        // Check id
                        for(var i=0; i<result.length; i++) {
                            found = false
                            for(var j=0; j<otherDocs.length; j++) {
                                if (Model.getName() < OtherModel.getName()) {
                                    if (result[i].id === doc.id+"_"+otherDocs[j].id) {
                                        total++;
                                        found = true;
                                        break;
                                    }
                                }
                                else {
                                    if (result[i].id === otherDocs[j].id+"_"+doc.id) {
                                        total++;
                                        found = true;
                                        break;
                                    }
                                }
                            }
                        }
                        assert.equal(total, 3);

                        done();
                    })
                }).error(done);

                
            }).error(done);
        })
        it('saveAll should create new links with the secondary value', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), true);
                    assert.equal(typeof doc.otherDocs[i].id, 'string');
                }

                var linkName, found;

                if(Model.getName() < OtherModel.getName()) {
                    linkName = Model.getName()+"_"+OtherModel.getName();
                }
                else {
                    linkName = OtherModel.getName()+"_"+Model.getName();
                }
                r.table(linkName).run().then(function(cursor) {
                    cursor.toArray().then(function(result) {
                        var total = 0;
                        // Testing the values of the primary key
                        for(var i=0; i<result.length; i++) {
                            if (result[i][Model.getName()+"_id"] ===  doc.id) {
                                found = false;
                                for(var j=0; j<otherDocs.length; j++) {
                                    if (result[i][OtherModel.getName()+"_id"] === otherDocs[j].id) {
                                        total++;
                                        found = true;
                                        break;
                                    }
                                }
                                assert(found);
                            }
                        }

                        assert.equal(total, 3);
                        done();
                    })
                }).error(done);

                
            }).error(done);
        })
    });
    
    describe('saveAll with missing docs for hasOne', function() {
        var Model, OtherModel;
        before(function() {
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
        });
        it('Should update link', function(done) {
            var doc = new Model({
                id: util.s8(),
                str: util.s8(),
                num: util.random()
            })
            var otherDoc = new OtherModel({
                id: util.s8(),
                str: util.s8(),
                num: util.random()
            })
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function() {
                assert(doc.isSaved())
                assert(doc.otherDoc.isSaved())
                doc.otherDoc = null;
                doc.saveAll().then(function() {
                    OtherModel.get(otherDoc.id).run().then(function(result) {
                        assert.equal(result.foreignKey, undefined);
                        done();
                    });
                });
            }).error(done);

        })
    });
    describe('saveAll with missing docs for hasMany', function() {
        var Model, OtherModel;
        before(function() {
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
        });
        it('Should update link', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function() {
                assert(doc.isSaved())
                for(var i=0; i<doc.otherDocs.length; i++) {
                    assert(doc.otherDocs[i].isSaved())
                }
                var removedDoc = doc.otherDocs.splice(1, 1);
                doc.saveAll().then(function() {
                    OtherModel.getAll(doc.id, {index: "foreignKey"}).run().then(function(result) {
                        assert.equal(result.length, 2);
                        OtherModel.run().then(function(result) {
                            assert.equal(result.length, 3);
                            done();
                        });

                    });
                });
            }).error(done);

        })
    });
    describe('saveAll with missing docs for belongsTo', function() {
        var Model, OtherModel;
        before(function() {
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
        });
        it('Should update link', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDoc = new OtherModel({str: util.s8(), num: util.random()});
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function() {
                assert(doc.isSaved())
                assert.equal(typeof doc.foreignKey, 'string')
                doc.otherDoc = null;
                doc.saveAll().then(function() {
                    assert(doc.foreignKey, undefined);
                    OtherModel.run().then(function(result) {
                        assert.equal(result.length, 1);
                        done();
                    });
                });
            }).error(done);

        })
    });
    
    
    describe('saveAll with missing docs for hasAndBelongsToMany', function() {
        var Model, OtherModel;
        before(function() {
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

            Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")
        });
        it('Should remove link', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function() {
                assert(doc.isSaved())
                for(var i=0; i<otherDocs.length; i++) {
                    assert(doc.otherDocs[i].isSaved())
                }
                var removedDoc = doc.otherDocs.splice(1, 1);
                doc.saveAll().then(function(result) {
                    assert.equal(doc.otherDocs.length, 2);
                    assert.equal(result.otherDocs.length, 2);

                    var linkName;
                    if(Model.getName() < OtherModel.getName()) {
                        linkName = Model.getName()+"_"+OtherModel.getName();
                    }
                    else {
                        linkName = OtherModel.getName()+"_"+Model.getName();
                    }
                    r.table(linkName).count().run().then(function(result) {
                        assert.equal(result, 2);

                        Model.get(doc.id).getJoin().run().then(function(result) {
                            assert.equal(result.otherDocs.length, 2);
                            done();
                        }).error(done);
                    }).error(done);
                }).error(done);
            }).error(done);
        })
    });
});


describe('delete', function() {
    describe('Basic', function() {
        var Model, doc;
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
            assert.equal(doc.isSaved(), false);
            doc.save().then(function(result) {
                assert.equal(typeof doc.id, 'string');
                assert.equal(doc.isSaved(), true);
                done();
            }).error(done);
        });
        it('should delete the document', function(done) {
            doc.delete().then(function() {
                Model.run().then(function(result) {
                    assert.equal(result.length, 0);
                    done();
                });
            }).error(done);
        });
        it('should set the doc unsaved', function(done) {
            doc.save().then(function(result) {
                assert.equal(typeof doc.id, 'string');
                assert.equal(doc.isSaved(), true);
                doc.delete().then(function() {
                    Model.run().then(function(result) {
                        assert.equal(doc.isSaved(), false);
                        done();
                    });
                }).error(done);
            }).error(done);
        });
    });
    describe('hasOne', function() {
        var Model, doc;
        before(function() {
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
        });
        it('delete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.delete().then(function() {
                    Model.run().then(function(result) {
                        assert.equal(result.length, 0);
                        assert.equal(otherDoc.foreignKey, undefined);

                        OtherModel.run().then(function(result) {
                            assert.equal(result.length, 1);
                            assert.deepEqual(result[0], otherDoc);
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll().then(function() {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(otherDoc.isSaved(), false);
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");
                        OtherModel.get(otherDoc.id).run().error(function(error) {
                            assert.equal(error.message, "Cannot build a new instance of `"+OtherModel.getName()+"` with `null`.");
                            done();
                        });
                    });
                });

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({otherDoc: true}).then(function() {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(otherDoc.isSaved(), false);
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");
                        OtherModel.get(otherDoc.id).run().error(function(error) {
                            assert.equal(error.message, "Cannot build a new instance of `"+OtherModel.getName()+"` with `null`.");
                            done();
                        });
                    });
                });

            })
        });
        it('deleteAll with wrong modelToDelete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({foo: "bar"}).then(function() {
                    Model.run().then(function(result) {
                        assert.equal(result.length, 0);
                        assert.equal(otherDoc.foreignKey, undefined);

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, otherDoc);
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });

    });
    describe('belongsTo', function() {
        var Model, doc;
        before(function() {
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
        });
        it('delete should delete only the document and not update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                otherDocCopy = util.deepCopy(doc.otherDoc);

                doc.delete().then(function() {
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, otherDoc);
                            assert.deepEqual(result, otherDocCopy);

                            done();
                        });
                    });
                });
            });
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll().then(function(result) {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(doc.otherDoc.isSaved(), false);

                    assert.equal(result.isSaved(), false);
                    assert.equal(result.otherDoc.isSaved(), false);
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.get(otherDoc.id).run().error(function(error) {
                            assert.equal(error.message, "Cannot build a new instance of `"+OtherModel.getName()+"` with `null`.");
                            done();
                        });
                    });
                });
            });
        });
        it('deleteAll should delete everything when given the appropriate modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({otherDoc: true}).then(function(result) {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(doc.otherDoc.isSaved(), false);

                    assert.equal(result.isSaved(), false);
                    assert.equal(result.otherDoc.isSaved(), false);
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.get(otherDoc.id).run().error(function(error) {
                            assert.equal(error.message, "Cannot build a new instance of `"+OtherModel.getName()+"` with `null`.");
                            done();
                        });
                    });
                });
            })
        });
        it('delete should delete only the document with non matching modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                otherDocCopy = util.deepCopy(doc.otherDoc);

                doc.deleteAll({foo: true}).then(function() {
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, otherDoc);
                            assert.deepEqual(result, otherDocCopy);

                            done();
                        });
                    });
                });
            });
        });
    });
    describe('hasMany', function() {
        var Model, doc;
        before(function() {
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
        });
        it('delete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.delete().then(function() {
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].foreignKey, undefined);
                            assert.equal(otherDocs[i].isSaved(), true);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            done();
                        });
                    });
                });
            });
        });
        it('delete should delete only the document and update the other -- non matching modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({foo: true}).then(function() {
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");
                        assert.equal(doc.isSaved(), false);
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].foreignKey, undefined);
                            assert.equal(otherDocs[i].isSaved(), true);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll().then(function(result) {
                    assert.strictEqual(result, doc);
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].isSaved(), false);
                            // We want to keep the foreign key -- consistent yet unsaved data
                            assert.notEqual(otherDocs[i].foreignKey, undefined);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);
                            done();
                        });
                    });
                });
            });
        });
        it('deleteAll should delete everything -- with modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({otherDocs: true}).then(function(result) {
                    assert.strictEqual(result, doc);
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].isSaved(), false);
                            // We want to keep the foreign key -- consistent yet unsaved data
                            assert.notEqual(otherDocs[i].foreignKey, undefined);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);
                            done();
                        });
                    });
                });
            });
        });
    });
    describe('hasAndBelongsToMany', function() {
        var Model, doc;
        before(function() {
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
                num: Number
            })

            Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")
        });
        it('delete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.delete().then(function(result) {
                    assert.strictEqual(doc, result);
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), true)
                    }
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
        it('deleteAll should delete only the document and update the other -- with non matching modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.deleteAll({foo: true}).then(function() {
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), true)
                    }
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                }).error(done);
                            }).error(done);
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.deleteAll().then(function() {
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), false)
                    }
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);

                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                }).error(done);
                            }).error(done);
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything -- with the appropriate modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.deleteAll({otherDocs: true}).then(function() {
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), false)
                    }
                    Model.get(doc.id).run().error(function(error) {
                        assert.equal(error.message, "Cannot build a new instance of `"+Model.getName()+"` with `null`.");

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);

                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                }).error(done);
                            }).error(done);
                        }).error(done);

                    });
                }).error(done);

            })
        });

    });
});

