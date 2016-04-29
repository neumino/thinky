var config = require(__dirname+'/../config.js');

/*
 * Extend config with
 *  timeforma='ŕaw'
 *  enforce={
 *  extra: true
 *  missing: true
 *  type: 'strict'
 *  }
 */
config['timeFormat'] = 'raw';
config['enforce_extra'] =  'strict';
config['enforce_missing'] =  true;
config['enforce_type'] =  'strict';
config['validate'] = 'oncreate';


var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var libUtil = require(__dirname+'/../lib/util.js');
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
  it('table option on a model', function(done){
    var name = util.s8();
    var Model = thinky.createModel(name, {id: String, name: String}, {
      table: {
        durability: 'soft'
      }
    });
    Model.once('ready', function() {
      r.table(Model.getTableName()).config().run().then(function(result) {
        assert.equal(result.durability, 'soft');
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
      return error.message === "Value for [id] must be defined.";
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

describe('mergeOptions', function(){
  it('mergeOptions - merge to an empty object', function() {
    var newOptions = libUtil.mergeOptions(undefined, {enforce_missing: true});
    assert.equal(newOptions.enforce_missing, true);
    assert.equal(newOptions.enforce_extra, undefined);
    assert.equal(newOptions.enforce_type, undefined);
  });
  it('mergeOptions - replace an existing option', function() {
    var existingOptions = {enforce_missing: true};
    var newOptions = libUtil.mergeOptions(existingOptions, {enforce_missing: false});
    assert.equal(newOptions.enforce_missing, false);
    assert.equal(newOptions.enforce_extra, undefined);
    assert.equal(newOptions.enforce_type, undefined);
  });
  it('mergeOptions - without affecting other options - enforce_missing', function() {
    var existingOptions = {enforce_type: "strict", enforce_extra: false};
    var newOptions = libUtil.mergeOptions(existingOptions, {enforce_missing: true});
    assert.equal(newOptions.enforce_missing, true);
    assert.equal(newOptions.enforce_extra, false);
    assert.equal(newOptions.enforce_type, "strict");
  });
  it('mergeOptions - without affecting other options - enforce_type', function() {
    var existingOptions = {enforce_missing: true, enforce_extra: false};
    var newOptions = libUtil.mergeOptions(existingOptions, {enforce_type: "loose"});
    assert.equal(newOptions.enforce_missing, true);
    assert.equal(newOptions.enforce_extra, false);
    assert.equal(newOptions.enforce_type, "loose");
  });
  it('mergeOptions - without affecting other options - enforce_extra', function() {
    var existingOptions = {enforce_missing: false, enforce_type: "loose"};
    var newOptions = libUtil.mergeOptions(existingOptions, {enforce_extra: true});
    assert.equal(newOptions.enforce_missing, false);
    assert.equal(newOptions.enforce_extra, true);
    assert.equal(newOptions.enforce_type, "loose");
  });
  it('mergeOptions - with empty new options object', function() {
    var existingOptions = {enforce_missing: true, enforce_extra: true, enforce_type: "loose"};
    var newOptions = libUtil.mergeOptions(existingOptions, {});
    assert.equal(newOptions.enforce_missing, true);
    assert.equal(newOptions.enforce_extra, true);
    assert.equal(newOptions.enforce_type, "loose");
  });
  it('mergeOptions - with undefined new options object', function() {
    var existingOptions = {enforce_missing: false, enforce_extra: false, enforce_type: "strict"};
    var newOptions = libUtil.mergeOptions(existingOptions, undefined);
    assert.equal(newOptions.enforce_missing, false);
    assert.equal(newOptions.enforce_extra, false);
    assert.equal(newOptions.enforce_type, "strict");
  });
});
