var thinky = require('../lib/index.js');
var should = require('should');
var assert = require('assert');
var r = require('rethinkdb');
var _ = require('underscore');

thinky.init({})

describe('Document', function(){
    describe('getDocument', function(){
        it('should return different objects', function(){
            var Cat = thinky.createModel('Cat', { id: String, name: String, age: 20});
            var catou = new Cat({name: 'Catou'});
            var minou = new Cat({name: 'Minou'});

            should.exist(catou.getDocument());
            catou.getDocument().should.not.equal(minou.getDocument());
        });
    });
    describe('getModel', function() {
        it('should return a model shared by all instances of the model', function(){
            var Cat = thinky.createModel('Cat', { id: String, name: String, age: 20});
            var catou = new Cat({name: 'Catou'});
            var minou = new Cat({name: 'Minou'});

            should.exist(catou.getModel());
            should.equal(catou.getModel(), minou.getModel());
        });
    });


    // Test define
    describe('definePrivate', function() {
        it('should save a method', function() {
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            var minou = new Cat({name: 'Minou'});
            catou.definePrivate('helloDoc', function() { return 'hello, my name is '+this.name; })

            should.equal(catou.helloDoc(), 'hello, my name is Catou');
        });
        it('should not add the function for other documents', function(){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            var minou = new Cat({name: 'Minou'});
            catou.definePrivate('helloDoc', function() { return 'hello, my name is '+this.name; })

            should.not.exist(minou.helloDoc);
        });
        it('should not add the function for new documents', function(){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            catou.definePrivate('helloDoc', function() { return 'hello, my name is '+this.name; })
            var minou = new Cat({name: 'Minou'});

            should.not.exist(minou.helloDoc);
        });
    });

    // Test merge 
    describe('merge', function() {
        it('should merge all fields', function(){
            var Cat = thinky.createModel('Cat', { id: Number, name: String }, {enforce: true});
            var catou = new Cat({id: 1, name: 'Catou'});
            catou.merge({id: 2, name: 'CatouBis'});

            should.equal(catou.id, 2);
            should.equal(catou.name, 'CatouBis');
        });
        it('should not throw if merge is recursif (default settings) even if the schema is enforced', function(){
            var Cat = thinky.createModel('Cat', { id: Number, name: String }, {enforce: true});
            var catou = new Cat({id: 1, name: 'Catou'});

            catou.merge({name: 'CatouTer'});
            should.equal(catou.id, 1);
            should.equal(catou.name, 'CatouTer');
        });
        it('should throw if schema is enforced -- extra field', function(){
            var Cat = thinky.createModel('Cat', { id: Number, name: String }, {enforce: true});
            var catou = new Cat({id: 1, name: 'Catou'});

            (function() { catou.merge({id: 2, name: 'CatouBis', extraField: 3});}).should.throw('An extra field `[extraField]` not defined in the schema was found.');
        });
        it('should throw if schema is enforced -- missing field', function(){
            var Cat = thinky.createModel('Cat', { id: Number, name: String }, {enforce: true});
            var catou = new Cat({id: 1, name: 'Catou'});

            (function() { catou.merge({name: 'catoubis'}, true);}).should.throw('Value for [id] must be defined')
        });
        it('should throw if schema is enforced -- wrong type field', function(){
            var Cat = thinky.createModel('Cat', { id: Number, name: String }, {enforce: true});
            var catou = new Cat({id: 1, name: 'Catou'});

            (function() { catou.merge({id: 'nonValidValue', name: 'CatouBis', extraField: 3});}).should.throw('Value for [id] must be a Number');
        });
        it('should emit the event `change`', function(done){
            var Cat = thinky.createModel('Cat', { id: Number, name: String });
            var catou = new Cat({id: 1, name: 'Catou'});
            catou.on('change', function() {
                done();
            });
            catou.merge({name: 'CatouBis'});
        });
    });


    // Test against the database
    describe('save', function() {
        it('should add a field id -- Testing document', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            catou.save(null, function(error, result) {
                should.exist(result.id);
                done();
            })
        });
        it('should add a field id -- Testing document -- other signature', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            catou.save(function(error, result) {
                should.exist(result.id);
                done();
            });
        });

        it('should not change the reference of the object', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            catou.save(null, function(error, result) {
                should.equal(catou, result);
                done();
            });
        });
        it('should update the document in the database', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            catou.save(null, function(error, result) {
                var value = 'Catouuuuu';
                catou.name = value;

                // Make sure that the doc is saved, so we are going to trigger an update next time
                should.equal(catou.getDocSettings().saved, true);

                catou.save(null, function(error, result) {
                    Cat.get(catou.id).run(function(error, result) {
                        should.equal(result.name, value);
                        done();
                    });
                });
            });
        });
        it('should update the document (in place)', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            catou.save(null, function(error, result) {
                var value = 'Catouuuuu';
                catou.name = value;

                // Make sure that the doc is saved, so we are going to trigger an update next time
                should.equal(catou.getDocSettings().saved, true);

                catou.save(null, function(error, result) {
                    should.equal(catou, result);
                    should.equal(catou.name, value);
                    done();
                });
            });
        });
        
        // Testing events with save
        it('should emit the event `save` on insert', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catName = 'Catou'
            var catou = new Cat({name: catName});
            catou.on('save', function(doc) {
                should.equal(doc.name, catName);
                done();
            });
            catou.save();
        });
        it('should emit the event `save` on update', function(done) {
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var oldName = 'Catou I';
            var newName = 'Catou II';
            var catou = new Cat({name: oldName});

            catou.save(function(error, result) {
                if (error) throw error;
                catou.name = newName;
                
                catou.on('save', function(doc, oldDoc) {
                    should.equal(doc.name, newName);
                    should.equal(oldDoc.name, oldName);
                    done();
                });

                catou.save( function(error, result) {
                    if (error) throw error;
                    catou.off('save');
                });
            });
        });

        // Testing with joins
        it('should not save the joined document by default -- hasOne', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            catou['owner'] = owner;

            catou.save(function(error, result) {
                should.exist(catou.id);
                should.not.exist(catou.idHuman);
                should.not.exist(catou.owner.id);
                done();
            });
        });
        it('should be able to save the joined doc -- hasOne', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            catou['owner'] = owner;

            catou.save({saveJoin: true}, function(error, result) {
                should.exist(catou.id);
                should.exist(catou.idHuman);
                should.exist(catou.owner.id);

                done();
            });
        });
        it('should keep the references when saving joined documents -- hasOne', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            catou['owner'] = owner;
            var catouOriginal = catou;

            catou.save({saveJoin: true}, function(error, result) {
                should.equal(catou.owner, owner)
                should.equal(catouOriginal, catou)

                catou.getDocSettings().saved.should.be.true
                catou.owner.getDocSettings().saved.should.be.true
                done();
            });
        });
        it('should marked joined documents that are saved `saved` -- hasOne', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            catou['owner'] = owner;
            var catouOriginal = catou;

            catou.save({saveJoin: true}, function(error, result) {
                catou.getDocSettings().saved.should.be.true
                catou.owner.getDocSettings().saved.should.be.true
                done();
            });
        });


        it('should be able to save the joined doc -- nested hasOne', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String, idMom: String});
            var Mother = thinky.createModel('Mother', {id: String, motherName: String});
            Human.hasOne(Mother, 'mom', {leftKey: 'idMom', rightKey: 'id'});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            var mother = new Mother({motherName: "Mom"});
            catou['owner'] = owner;
            owner['mom'] = mother;

            catou.save( {saveJoin: true}, function(error, result) {
                should.exist(catou.id);
                should.exist(catou.idHuman);
                should.exist(catou.owner.id);
                done();
            });
        });

        it('should not save the joined docs by default -- hasMany', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, taskIds: [String]});
            var Task = thinky.createModel('Task', {id: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'taskIds', rightKey: 'id'});

            var catou = new Cat({name: "Catou"});
            var task1 = new Task({task: "Catch the red dot"});
            var task2 = new Task({task: "Eat"});
            var task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save(function(error, result) {
                should.not.exist(catou.taskIds);
                should.not.exist(catou.tasks[0].id);
                should.not.exist(catou.tasks[1].id);
                should.not.exist(catou.tasks[2].id);

                done();
            });
        });
        it('should be able to save the joined doc -- hasMany', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, taskIds: [String]});
            var Task = thinky.createModel('Task', {id: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'taskIds', rightKey: 'id'});

            var catou = new Cat({name: "Catou"});
            var task1 = new Task({task: "Catch the red dot"});
            var task2 = new Task({task: "Eat"});
            var task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, result) {
                catou.taskIds.should.have.length(3);
                should.exist(catou.taskIds[0]);
                should.exist(catou.taskIds[1]);
                should.exist(catou.taskIds[2]);
                should.exist(catou.tasks[0].id);
                should.exist(catou.tasks[1].id);
                should.exist(catou.tasks[2].id);

                done();
            });
        });

    });

    describe('delete', function() {
        it('should delete the doc', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            catou.save(null, function(error, result) {
                should.exist(result.id);
                catou.delete( null, function(error, result) {
                    catou.getDocSettings().saved.should.be.false
                    done();
                })
            })
        });
        it('should delete the doc -- other signature', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            catou.save(null, function(error, result) {
                should.exist(result.id);
                catou.delete(function(error, result) {
                    catou.getDocSettings().saved.should.be.false
                    done();
                })
            })
        });
        it('should not delete the joined doc by default -- hasOne joins', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String, idMom: String});
            var Mother = thinky.createModel('Mother', {id: String, motherName: String});
            Human.hasOne(Mother, 'mom', {leftKey: 'idMom', rightKey: 'id'});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            var mother = new Mother({motherName: "Mom"});
            catou['owner'] = owner;
            owner['mom'] = mother;

            catou.save( {saveJoin: true}, function(error, result) {
                should.exist(catou.id);
                should.exist(catou.idHuman);
                should.exist(catou.owner.id);

                catou.delete(function(error, result) {
                    if (error) throw error;
                    should.equal(result, 1);

                    catou.getDocSettings().saved.should.be.false
                    catou.owner.getDocSettings().saved.should.be.true
                    catou.owner.mom.getDocSettings().saved.should.be.true
                    done();
                })
            });
        });

        it('should be able to delete the joined doc -- hasOne joins', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, idHuman: String});
            var Human = thinky.createModel('Human', {id: String, ownerName: String, idMom: String});
            var Mother = thinky.createModel('Mother', {id: String, motherName: String});
            Human.hasOne(Mother, 'mom', {leftKey: 'idMom', rightKey: 'id'});
            Cat.hasOne(Human, 'owner', {leftKey: 'idHuman', rightKey: 'id'});

            var owner = new Human({ownerName: "Michel"});
            var catou = new Cat({name: "Catou"});
            var mother = new Mother({motherName: "Mom"});
            catou['owner'] = owner;
            owner['mom'] = mother;

            catou.save( {saveJoin: true}, function(error, result) {
                should.exist(catou.id);
                should.exist(catou.idHuman);
                should.exist(catou.owner.id);

                catou.delete( {deleteJoin: true}, function(error, result) {
                    catou.getDocSettings().saved.should.be.false
                    catou.owner.getDocSettings().saved.should.be.false
                    catou.owner.mom.getDocSettings().saved.should.be.false
                    done();
                })
            });
        });

        it('should not save the joined doc by default -- hasMany', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, taskIds: [String]});
            var Task = thinky.createModel('Task', {id: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'taskIds', rightKey: 'id'});

            var catou = new Cat({name: "Catou"});
            var task1 = new Task({task: "Catch the red dot"});
            var task2 = new Task({task: "Eat"});
            var task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, result) {
                catou.delete(function(error, result) {
                    should.equal(catou.getDocSettings().saved, false);
                    should.equal(catou.tasks[0].getDocSettings().saved, true);
                    should.equal(catou.tasks[1].getDocSettings().saved, true);
                    should.equal(catou.tasks[2].getDocSettings().saved, true);

                    done();
                });
            });
        });
        it('should be able to delete joined docs -- hasMany', function(done) {
            var Cat = thinky.createModel('Cat', {id: String, name: String, taskIds: [String]});
            var Task = thinky.createModel('Task', {id: String, task: String});
            Cat.hasMany(Task, 'tasks', {leftKey: 'taskIds', rightKey: 'id'});

            var catou = new Cat({name: "Catou"});
            var task1 = new Task({task: "Catch the red dot"});
            var task2 = new Task({task: "Eat"});
            var task3 = new Task({task: "Sleep"});
            catou.tasks = [task1, task2, task3];
            catou.save({saveJoin: true}, function(error, result) {

                catou.delete({deleteJoin: true}, function(error, result) {
                    should.equal(catou.getDocSettings().saved, false);
                    should.equal(catou.tasks[0].getDocSettings().saved, false);
                    should.equal(catou.tasks[1].getDocSettings().saved, false);
                    should.equal(catou.tasks[2].getDocSettings().saved, false);

                    done();
                });
            });
        });
    });


    // Test listener
    describe('on', function() {
        it('should execute the callback when the even is emitted', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            catou.on('testEvent', function() {
                done();
            });
            catou.emit('testEvent');
        });
        it('should add a listener', function() {
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            catou.on('testEvent', function() {
            });
            catou.listeners.should.have.length(1);
        });
    });
    describe('off', function() {
        it('should be the same as removeListener', function() {
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});

            should(catou.off, catou.removeListener);
        });
        it('should remove a listener', function() {
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            var listener = function() {}
            catou.on('testEvent', listener);
            catou.off('testEvent', listener);

            catou.listeners('testEvent').should.have.length(0);
        });
    });
    // TODO test that all methods from the EventEmitter have been copied
    
    describe('merge', function() {
        it('should emit the event `change`', function(done){
            var Cat = thinky.createModel('Cat', { id: String, name: String });
            var catou = new Cat({name: 'Catou'});
            var listener = function() {
                catou.removeAllListeners('save');
                done();
            }

            catou.on('change', listener);
            catou.merge({name: 'CatouBis'});
        });
    });
})
