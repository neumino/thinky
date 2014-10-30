var config = require(__dirname+'/../config.js');

/*
 * Extend config with
 *  timeforma='ŕaw'
 *  enforce={
 *    extra: true
 *    missing: true
 *    type: 'strict'
 *  }
 */
config['timeFormat'] = 'raw';
config['enforce_extra'] =  'strict';
config['enforce_missing'] =  true;
config['enforce_type'] =  'strict';
config['validate'] = 'oncreate';


var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

describe('Options', function(){
    it('Options on the top level namespace', function(){
        assert.deepEqual(thinky.getOptions(), {
            timeFormat: 'raw',
            enforce_extra: 'strict',
            enforce_missing: true,
            enforce_type: 'strict',
            validate: 'oncreate'
        });
    });

    it('Options on a model', function(){
        var name = util.s8();
        var Model = thinky.createModel(name, {id: String, name: String}, {
            timeFormat: 'native',
            enforce_extra: 'none',
            enforce_missing: false,
            enforce_type: 'loose',
            validate: 'onsave'
        });

        assert.deepEqual(Model.getOptions(), {
            timeFormat: 'native',
            enforce_extra: 'none',
            enforce_missing: false,
            enforce_type: 'loose',
            validate: 'onsave'
        })

        // Make sure we didn't messed up the global options
        assert.deepEqual(thinky.getOptions(), {
            timeFormat: 'raw',
            enforce_extra: 'strict',
            enforce_missing: true,
            enforce_type: 'strict',
            validate: 'oncreate'
        });

    });
    it('pk option on a model', function(done){
        var name = util.s8();
        var Model = thinky.createModel(name, {id: String, name: String}, {
            pk: 'path'
        });
        Model.once('ready', function() {
            r.table(Model.getTableName()).info().run().then(function(result) {
                assert.equal(result.primary_key, 'path');
                done();
            });
        });
    });
    it('Options on a document', function(){
        var name = util.s8();
        var Model = thinky.createModel(name, {id: String, name: String});

        var doc = new Model({}, {
            timeFormat: 'raw',
            enforce_extra: 'none',
            enforce_missing: false,
            enforce_type: 'none',
            validate: 'onsave'
        })

        assert.deepEqual(doc._getOptions(), {
            timeFormat: 'raw',
            enforce_extra: 'none',
            enforce_missing: false,
            enforce_type: 'none',
            validate: 'onsave'
        })
       
        // Make sure we didn't messed up the global options
        assert.deepEqual(thinky.getOptions(), {
            timeFormat: 'raw',
            enforce_extra: 'strict',
            enforce_missing: true,
            enforce_type: 'strict',
            validate: 'oncreate'
        });
    });
})

describe('Priorities for options', function() {
    it('Thinky options are used by default', function() {
        /*
        Thinky options:
            config['timeFormat'] = 'raw';
            config['enforce_extra'] =  'strict';
            config['enforce_missing'] =  true;
            config['enforce_type'] =  'strict';
            config['validate'] = 'oncreate';
        */
        var name = util.s8();
        var Model = thinky.createModel(name, {id: String, name: String});
        assert.throws(function() {
            var doc = new Model({})
        }, function(error) {
            return error.message === "Value for .id must be defined.";
        });
    });
    it("Thinky options can be overwritten by the Model's one", function() {
        /*
        Thinky options:
            config['timeFormat'] = 'raw';
            config['enforce_extra'] =  'strict';
            config['enforce_missing'] =  true;
            config['enforce_type'] =  'strict';
            config['validate'] = 'oncreate';
        */
        var name = util.s8();
        var Model = thinky.createModel(name, {id: String, name: String}, {enforce_missing: false});
        var doc = new Model({})
        doc.validate();
    });
    it("Thinky options can be overwritten by the Document's one", function() {
        /*
        Thinky options:
            config['timeFormat'] = 'raw';
            config['enforce_extra'] =  'strict';
            config['enforce_missing'] =  true;
            config['enforce_type'] =  'strict';
            config['validate'] = 'oncreate';
        */
        var name = util.s8();
        var Model = thinky.createModel(name, {id: String, name: String});
        var doc = new Model({}, {enforce_missing: false})
        doc.validate();
    });
    it("Thinky options can be overwritten by the options given to validate", function() {
        /*
        Thinky options:
            config['timeFormat'] = 'raw';
            config['enforce_extra'] =  'strict';
            config['enforce_missing'] =  true;
            config['enforce_type'] =  'strict';
            config['validate'] = 'oncreate';
        */
        var name = util.s8();
        var Model = thinky.createModel(name, {id: String, name: String}, {validate: "onsave"});
        var doc = new Model({})
        doc.validate({enforce_missing: false});
    });
    it("Thinky options can be overwritten by the options in the schema", function() {
        /*
        Thinky options:
            config['timeFormat'] = 'raw';
            config['enforce_extra'] = 'strict';
            config['enforce_missing'] =  true;
            config['enforce_type'] =  'strict';
            config['validate'] = 'oncreate';
        */
        var name = util.s8();
        var Model = thinky.createModel(name, {id: {_type: String, options: {enforce_missing: false}}, name: {_type: String, options: {enforce_missing: false}}});
        var doc = new Model({})
        doc.validate();
    });
});
