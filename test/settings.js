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
config['enforce_extra'] =  true;
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
            enforce_extra: true,
            enforce_missing: true,
            enforce_type: 'strict',
            validate: 'oncreate'
        });
    });

    it('Options on a model', function(){
        var name = util.s4();
        Model = thinky.createModel(name, {id: String, name: String}, {
            timeFormat: 'native',
            enforce_extra: false,
            enforce_missing: false,
            enforce_type: 'loose',
            validate: 'onsave'
        });

        assert.deepEqual(Model.getOptions(), {
            timeFormat: 'native',
            enforce_extra: false,
            enforce_missing: false,
            enforce_type: 'loose',
            validate: 'onsave'
        })

        // Make sure we didn't messed up the global options
        assert.deepEqual(thinky.getOptions(), {
            timeFormat: 'raw',
            enforce_extra: true,
            enforce_missing: true,
            enforce_type: 'strict',
            validate: 'oncreate'
        });

    });
    it('Options on a document', function(){
        var name = util.s4();
        Model = thinky.createModel(name, {id: String, name: String});

        var doc = new Model({}, {
            timeFormat: 'raw',
            enforce_extra: false,
            enforce_missing: false,
            enforce_type: 'none',
            validate: 'onsave'
        })

        assert.deepEqual(doc.getOptions(), {
            timeFormat: 'raw',
            enforce_extra: false,
            enforce_missing: false,
            enforce_type: 'none',
            validate: 'onsave'
        })
       
        // Make sure we didn't messed up the global options
        assert.deepEqual(thinky.getOptions(), {
            timeFormat: 'raw',
            enforce_extra: true,
            enforce_missing: true,
            enforce_type: 'strict',
            validate: 'oncreate'
        });
    });
})
